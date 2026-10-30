import { requisicao } from './client'

/** GET /api/conversas: conversas do usuário, com a última mensagem e as não lidas. */
export function listarConversas() {
  return requisicao('/api/conversas')
}

/** POST /api/conversas: abre (ou reaproveita) a conversa com a pessoa. 403 se ela não aceita mensagens. */
export function abrirConversa(usuarioId) {
  return requisicao('/api/conversas', { method: 'POST', body: { usuarioId } })
}

/** GET /api/conversas/{id}/mensagens: mais antigas primeiro; marca as recebidas como lidas. */
export function listarMensagens(conversaId) {
  return requisicao(`/api/conversas/${conversaId}/mensagens`)
}

/** POST /api/conversas/{id}/mensagens. */
export function enviarMensagem(conversaId, texto) {
  return requisicao(`/api/conversas/${conversaId}/mensagens`, { method: 'POST', body: { texto } })
}
