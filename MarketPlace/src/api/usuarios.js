import { requisicao } from './client'

/** GET /api/usuarios/me: perfil do usuário logado. */
export function obterMe() {
  return requisicao('/api/usuarios/me')
}

/** GET /api/usuarios/me/configuracoes: {tema, ...booleanos}. */
export function obterConfiguracoes() {
  return requisicao('/api/usuarios/me/configuracoes')
}

/** PUT /api/usuarios/me/configuracoes: exige todos os campos; devolve a configuração salva. */
export function salvarConfiguracoes(configuracoes) {
  return requisicao('/api/usuarios/me/configuracoes', { method: 'PUT', body: configuracoes })
}
