import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from './client'
import { listarNotificacoes, marcarLida, marcarTodas, obterContagem } from './notificacoes'
import { chamadas, mockarApi, notificacao } from '../test/apiFalsa.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('notificações', () => {
  it('busca a contagem de não lidas', async () => {
    mockarApi({ 'GET /api/notificacoes/contagem': { naoLidas: 3, mensagensNaoLidas: 1 } })

    await expect(obterContagem()).resolves.toEqual({ naoLidas: 3, mensagensNaoLidas: 1 })
  })

  it('lista com limite, antesDeId e naoLidas só quando pedidos', async () => {
    const fetchFalso = mockarApi({ 'GET /api/notificacoes': [notificacao(5)] })

    await listarNotificacoes({ limite: 10 })
    await listarNotificacoes({ limite: 20, antesDeId: 40, naoLidas: true })

    expect(fetchFalso.mock.calls[0][0]).toBe(`${API_URL}/api/notificacoes?limite=10`)
    expect(fetchFalso.mock.calls[1][0]).toBe(`${API_URL}/api/notificacoes?limite=20&antesDeId=40&naoLidas=true`)
  })

  it('marca uma e marca todas até o id informado', async () => {
    const fetchFalso = mockarApi({ 'PUT /api/notificacoes/5/lida': null, 'PUT /api/notificacoes/lidas': null })

    await expect(marcarLida(5)).resolves.toBeNull()
    await marcarTodas(9)
    await marcarTodas()

    expect(chamadas(fetchFalso, 'PUT /api/notificacoes/5/lida')).toEqual([undefined])
    expect(chamadas(fetchFalso, 'PUT /api/notificacoes/lidas')).toEqual([{ ateId: 9 }, {}])
  })
})
