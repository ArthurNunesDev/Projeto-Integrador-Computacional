import { comFiltros, requisicao } from './client'

/** GET /api/oportunidades: filtros opcionais {tipo, areaId, modalidade, status, autorId, busca}; mais novas primeiro. */
export function listarOportunidades(filtros) {
  return requisicao(comFiltros('/api/oportunidades', filtros))
}

/** POST /api/oportunidades: {tipo, titulo, descricao, modalidade, status?, areaIds}. */
export function criarOportunidade(oportunidade) {
  return requisicao('/api/oportunidades', { method: 'POST', body: oportunidade })
}

/** POST/DELETE /api/oportunidades/{id}/participacao. */
export function definirParticipacao(id, participar) {
  return requisicao(`/api/oportunidades/${id}/participacao`, { method: participar ? 'POST' : 'DELETE' })
}

/** PUT/DELETE /api/oportunidades/{id}/salvo (idempotente). */
export function definirSalva(id, salvar) {
  return requisicao(`/api/oportunidades/${id}/salvo`, { method: salvar ? 'PUT' : 'DELETE' })
}

/** GET /api/usuarios/me/participacoes. */
export function listarParticipacoes() {
  return requisicao('/api/usuarios/me/participacoes')
}

/** GET /api/usuarios/me/salvos. */
export function listarSalvas() {
  return requisicao('/api/usuarios/me/salvos')
}
