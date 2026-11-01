import { comFiltros, requisicao } from './client'

/** GET /api/habilidades-publicadas: filtros opcionais {usuarioId, categoria, busca}. */
export function listarHabilidadesPublicadas(filtros) {
  return requisicao(comFiltros('/api/habilidades-publicadas', filtros))
}

/** POST /api/habilidades-publicadas: {nome, categoria, nivel, descricao, disponibilidade}. */
export function publicarHabilidade(habilidade) {
  return requisicao('/api/habilidades-publicadas', { method: 'POST', body: habilidade })
}

/** PUT /api/habilidades-publicadas/{id} (só o dono). */
export function atualizarHabilidade(id, habilidade) {
  return requisicao(`/api/habilidades-publicadas/${id}`, { method: 'PUT', body: habilidade })
}

/** DELETE /api/habilidades-publicadas/{id} (só o dono). */
export function excluirHabilidade(id) {
  return requisicao(`/api/habilidades-publicadas/${id}`, { method: 'DELETE' })
}
