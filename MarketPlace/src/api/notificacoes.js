import { comFiltros, requisicao } from './client'

/** GET /api/notificacoes/contagem: {naoLidas, mensagensNaoLidas}. */
export function obterContagem({ signal } = {}) {
  return requisicao('/api/notificacoes/contagem', { signal })
}

/**
 * GET /api/notificacoes: mais novas primeiro (id decrescente). antesDeId pagina para trás;
 * naoLidas só é enviado quando true. Se vier menos que `limite`, não há mais páginas.
 */
export function listarNotificacoes({ limite = 20, antesDeId, naoLidas = false, signal } = {}) {
  const caminho = comFiltros('/api/notificacoes', { limite, antesDeId, naoLidas: naoLidas || undefined })
  return requisicao(caminho, { signal })
}

/** PUT /api/notificacoes/{id}/lida: 204. */
export function marcarLida(id) {
  return requisicao(`/api/notificacoes/${id}/lida`, { method: 'PUT' })
}

/** PUT /api/notificacoes/lidas: 204. Com ateId, marca só as de id menor ou igual (as que a tela mostrou). */
export function marcarTodas(ateId) {
  return requisicao('/api/notificacoes/lidas', { method: 'PUT', body: ateId == null ? {} : { ateId } })
}
