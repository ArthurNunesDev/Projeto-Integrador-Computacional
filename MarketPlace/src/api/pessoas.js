import { comFiltros, requisicao } from './client'

/** GET /api/pessoas: diretório de perfis públicos (sem o usuário logado); filtros {busca, categoria}. */
export function listarPessoas(filtros) {
  return requisicao(comFiltros('/api/pessoas', filtros))
}
