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

/** PUT /api/usuarios/me: substitui o perfil inteiro ({nome, cursoId, periodo, cidade, bio, fotoUrl}). */
export function atualizarMe(perfil) {
  return requisicao('/api/usuarios/me', { method: 'PUT', body: perfil })
}

/** PUT /api/usuarios/me/senha: 204; senha atual errada volta 400 com campos.senhaAtual. */
export function alterarSenha({ senhaAtual, novaSenha }) {
  return requisicao('/api/usuarios/me/senha', { method: 'PUT', body: { senhaAtual, novaSenha } })
}

/** DELETE /api/usuarios/me: exclui a conta, confirmando com a senha. */
export function excluirConta(senha) {
  return requisicao('/api/usuarios/me', { method: 'DELETE', body: { senha } })
}
