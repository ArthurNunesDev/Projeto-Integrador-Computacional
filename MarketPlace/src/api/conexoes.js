import { requisicao } from './client'

/** GET /api/conexoes: conexões aceitas. */
export function listarConexoes() {
  return requisicao('/api/conexoes')
}

/** GET /api/conexoes/recebidas: pedidos pendentes recebidos. */
export function listarRecebidas() {
  return requisicao('/api/conexoes/recebidas')
}

/** GET /api/conexoes/enviadas: pedidos pendentes enviados. */
export function listarEnviadas() {
  return requisicao('/api/conexoes/enviadas')
}

/** Todas as conexões (aceitas e pendentes) indexadas pelo id da outra pessoa. */
export async function mapaDeConexoes() {
  const listas = await Promise.all([listarConexoes(), listarRecebidas(), listarEnviadas()])
  return new Map(listas.flat().map((conexao) => [conexao.pessoa.id, conexao]))
}

/** POST /api/conexoes: envia um pedido de conexão. */
export function solicitarConexao(destinatarioId) {
  return requisicao('/api/conexoes', { method: 'POST', body: { destinatarioId } })
}

/** POST /api/conexoes/{id}/aceitar. */
export function aceitarConexao(id) {
  return requisicao(`/api/conexoes/${id}/aceitar`, { method: 'POST' })
}

/** POST /api/conexoes/{id}/recusar. */
export function recusarConexao(id) {
  return requisicao(`/api/conexoes/${id}/recusar`, { method: 'POST' })
}

/** DELETE /api/conexoes/{id}: desfaz a conexão ou cancela o pedido enviado. */
export function removerConexao(id) {
  return requisicao(`/api/conexoes/${id}`, { method: 'DELETE' })
}
