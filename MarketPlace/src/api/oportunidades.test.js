import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from './client'
import { definirStatusParticipacao, listarCandidatos } from './oportunidades'
import { chamadas, mockarApi, participacao, pessoaResumo } from '../test/apiFalsa.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('participações (autor)', () => {
  it('lista os candidatos da oportunidade', async () => {
    const lista = [participacao(10, pessoaResumo(4, 'Carla Dias'))]
    const fetchFalso = mockarApi({ 'GET /api/oportunidades/3/participacoes': lista })

    await expect(listarCandidatos(3)).resolves.toEqual(lista)
    expect(fetchFalso.mock.calls[0][0]).toBe(`${API_URL}/api/oportunidades/3/participacoes`)
  })

  it('define o status com PATCH e devolve a participação', async () => {
    const fetchFalso = mockarApi({
      'PATCH /api/participacoes/10': (corpo) => participacao(10, pessoaResumo(4, 'Carla Dias'), corpo),
    })

    await expect(definirStatusParticipacao(10, 'RECUSADA')).resolves.toMatchObject({ id: 10, status: 'RECUSADA' })
    expect(chamadas(fetchFalso, 'PATCH /api/participacoes/10')).toEqual([{ status: 'RECUSADA' }])
  })
})
