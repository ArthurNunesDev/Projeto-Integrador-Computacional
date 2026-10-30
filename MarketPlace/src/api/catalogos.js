import { requisicao } from './client'

/** GET /api/cursos: [{id, nome}] (rota pública). */
export function listarCursos() {
  return requisicao('/api/cursos')
}

/** GET /api/areas: [{id, nome}] (rota pública). */
export function listarAreas() {
  return requisicao('/api/areas')
}
