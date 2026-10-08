import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from './auth'
import {
  API_URL,
  ApiError,
  MENSAGEM_FALHA_REDE,
  definirOnNaoAutenticado,
  obterToken,
  requisicao,
  salvarToken,
} from './client'
import { obterMe, salvarConfiguracoes } from './usuarios'

function respostaJson(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

let fetchMock

beforeEach(() => {
  localStorage.clear()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requisicao', () => {
  it('devolve o JSON e envia o Bearer quando há token', async () => {
    salvarToken('abc')
    const perfil = { id: 1, nome: 'Ana', email: 'ana@faesa.br' }
    fetchMock.mockResolvedValue(respostaJson(200, perfil))

    await expect(obterMe()).resolves.toEqual(perfil)

    const [url, opcoes] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_URL}/api/usuarios/me`)
    expect(opcoes.method).toBe('GET')
    expect(opcoes.headers.Authorization).toBe('Bearer abc')
    expect(opcoes.body).toBeUndefined()
  })

  it('envia o corpo como JSON', async () => {
    const config = { tema: 'dark', perfilPublico: true }
    fetchMock.mockResolvedValue(respostaJson(200, config))

    await salvarConfiguracoes(config)

    const [, opcoes] = fetchMock.mock.calls[0]
    expect(opcoes.method).toBe('PUT')
    expect(opcoes.headers['Content-Type']).toBe('application/json')
    expect(opcoes.headers.Authorization).toBeUndefined()
    expect(JSON.parse(opcoes.body)).toEqual(config)
  })

  it('login salva o token', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, { token: 'jwt', usuario: { id: 1 } }))

    await login({ email: 'ana@faesa.br', senha: '12345678' })

    expect(obterToken()).toBe('jwt')
  })

  it('lança ApiError com status, mensagem e campos da API', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(400, { status: 400, erro: 'Dados inválidos', campos: { senha: 'tamanho deve ser entre 8 e 72' } }),
    )

    const erro = await requisicao('/api/auth/register', { method: 'POST', body: {} }).catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(400)
    expect(erro.mensagem).toBe('Dados inválidos')
    expect(erro.campos).toEqual({ senha: 'tamanho deve ser entre 8 e 72' })
  })

  it('401 com token limpa o token e chama o gancho', async () => {
    salvarToken('expirado')
    const gancho = vi.fn()
    const remover = definirOnNaoAutenticado(gancho)
    fetchMock.mockResolvedValue(respostaJson(401, { status: 401, erro: 'Não autenticado' }))

    const erro = await obterMe().catch((e) => e)
    remover()

    expect(erro).toMatchObject({ status: 401, mensagem: 'Não autenticado', campos: null })
    expect(obterToken()).toBeNull()
    expect(gancho).toHaveBeenCalledTimes(1)
  })

  it('401 sem token fora de /api/auth chama o gancho', async () => {
    const gancho = vi.fn()
    const remover = definirOnNaoAutenticado(gancho)
    fetchMock.mockResolvedValue(respostaJson(401, { status: 401, erro: 'Não autenticado' }))

    const erro = await obterMe().catch((e) => e)
    remover()

    expect(erro).toMatchObject({ status: 401 })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
    expect(gancho).toHaveBeenCalledTimes(1)
  })

  it('401 em /api/auth/login (senha errada) não limpa o token nem chama o gancho', async () => {
    salvarToken('sessao-atual')
    const gancho = vi.fn()
    const remover = definirOnNaoAutenticado(gancho)
    fetchMock.mockResolvedValue(respostaJson(401, { status: 401, erro: 'E-mail ou senha inválidos' }))

    const erro = await login({ email: 'ana@faesa.br', senha: 'errada123' }).catch((e) => e)
    remover()

    expect(erro).toMatchObject({ status: 401, mensagem: 'E-mail ou senha inválidos' })
    expect(obterToken()).toBe('sessao-atual')
    expect(gancho).not.toHaveBeenCalled()
  })

  it('rotas /api/auth/* não enviam o Bearer', async () => {
    salvarToken('abc')
    fetchMock.mockResolvedValue(respostaJson(200, { token: 'novo', usuario: { id: 1 } }))

    await login({ email: 'ana@faesa.br', senha: '12345678' })

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('401 não apaga um token trocado durante a requisição', async () => {
    salvarToken('antigo')
    const gancho = vi.fn()
    const remover = definirOnNaoAutenticado(gancho)
    fetchMock.mockImplementation(async () => {
      // Outra aba faz login enquanto a requisição está em andamento.
      salvarToken('novo')
      return respostaJson(401, { status: 401, erro: 'Não autenticado' })
    })

    const erro = await obterMe().catch((e) => e)
    remover()

    expect(erro).toMatchObject({ status: 401 })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer antigo')
    expect(obterToken()).toBe('novo')
  })

  it('falha de rede vira ApiError com status 0 e mensagem amigável', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const erro = await obterMe().catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(0)
    expect(erro.mensagem).toBe(MENSAGEM_FALHA_REDE)
  })

  it('erro sem corpo JSON usa mensagem genérica', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }))

    const erro = await obterMe().catch((e) => e)

    expect(erro).toMatchObject({ status: 502, mensagem: 'Erro na requisição (502)', campos: null })
  })
})
