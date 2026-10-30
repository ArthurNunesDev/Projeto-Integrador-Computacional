import { limparToken, requisicao, salvarToken } from './client'

/** POST /api/auth/register. Devolve o usuário criado (sem token: chame login em seguida). */
export function cadastrar({ nome, email, senha }) {
  return requisicao('/api/auth/register', { method: 'POST', body: { nome, email, senha } })
}

/** POST /api/auth/login. Salva o token e devolve {token, usuario}. */
export async function login({ email, senha }) {
  const resposta = await requisicao('/api/auth/login', { method: 'POST', body: { email, senha } })
  salvarToken(resposta.token)
  return resposta
}

/** Logout local: a API não guarda sessão, basta descartar o token. */
export function sair() {
  limparToken()
}
