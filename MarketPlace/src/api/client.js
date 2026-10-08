// Cliente HTTP da API Spring. Toda chamada ao backend passa por requisicao().

// Mesmo padrão usado em vite.config.js para montar o connect-src da CSP.
const URL_PADRAO = 'http://localhost:8080'

export const API_URL = (import.meta.env.VITE_API_URL || URL_PADRAO).replace(/\/+$/, '')

const CHAVE_TOKEN = 'marketfaesa-token'

export const MENSAGEM_FALHA_REDE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

/** Erro normalizado da API: {status, mensagem, campos}. status 0 = falha de rede. */
export class ApiError extends Error {
  constructor({ status, mensagem, campos = null }) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.mensagem = mensagem
    this.campos = campos
  }
}

// O storage pode lançar exceção (modo privado, site data bloqueado); nesse caso segue sem token.
export function obterToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
  } catch {
    // sem storage o token não persiste
  }
}

export function limparToken() {
  try {
    localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // nada a limpar
  }
}

let aoNaoAutenticado = null

/**
 * Registra a função chamada quando uma requisição autenticada volta 401
 * (token expirado ou inválido). O token já foi limpo quando ela roda.
 * Devolve uma função que desfaz o registro.
 */
export function definirOnNaoAutenticado(callback) {
  aoNaoAutenticado = callback
  return () => {
    if (aoNaoAutenticado === callback) aoNaoAutenticado = null
  }
}

async function lerCorpo(resposta) {
  const texto = await resposta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

/**
 * Faz uma requisição JSON para a API.
 * caminho: rota a partir da raiz do backend, ex.: '/api/usuarios/me'.
 * Envia o Bearer quando há token salvo. Devolve o corpo já convertido (ou null)
 * e lança ApiError em resposta de erro ou falha de rede.
 */
export async function requisicao(caminho, { method = 'GET', body, signal } = {}) {
  const token = obterToken()
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw new ApiError({ status: 0, mensagem: MENSAGEM_FALHA_REDE })
  }

  const dados = await lerCorpo(resposta)
  if (resposta.ok) return dados

  // 401 sem token enviado (ex.: senha errada no login) não é sessão expirada.
  if (resposta.status === 401 && token) {
    limparToken()
    aoNaoAutenticado?.()
  }

  throw new ApiError({
    status: resposta.status,
    mensagem: dados?.erro || `Erro na requisição (${resposta.status})`,
    campos: dados?.campos ?? null,
  })
}
