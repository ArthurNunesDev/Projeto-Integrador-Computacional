// API falsa para os testes: substitui o fetch global por uma tabela de rotas.
import { vi } from "vitest";

/** Resposta de erro no formato da API: {status, erro, campos?}. */
export function erroApi(status, erro, campos) {
  return { erroApi: true, status, corpo: { status, erro, ...(campos && { campos }) } };
}

/**
 * rotas: { "MÉTODO /caminho?query": resposta }. Sem rota com query, cai na rota sem query.
 * resposta: o corpo JSON (null = 204), erroApi(...), ou uma função (corpo da requisição) => resposta.
 * Devolve o vi.fn() do fetch; chamadas(fetch, "PUT /api/...") lista os corpos enviados para a rota.
 */
export function mockarApi(rotas) {
  const fetchFalso = vi.fn(async (url, { method = "GET", body } = {}) => {
    const { pathname, search } = new URL(url);
    const chave = `${method} ${pathname}${search}`;
    let resposta = chave in rotas ? rotas[chave] : rotas[`${method} ${pathname}`];
    if (resposta === undefined) resposta = erroApi(404, `Rota não mockada: ${chave}`);
    if (typeof resposta === "function") resposta = resposta(body ? JSON.parse(body) : undefined);
    if (resposta?.erroApi) return new Response(JSON.stringify(resposta.corpo), { status: resposta.status });
    return resposta == null ? new Response(null, { status: 204 }) : new Response(JSON.stringify(resposta), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

/** Corpos (já convertidos) das chamadas feitas a "MÉTODO /caminho". */
export function chamadas(fetchFalso, rota) {
  return fetchFalso.mock.calls
    .filter(([url, opcoes = {}]) => `${opcoes.method || "GET"} ${new URL(url).pathname}` === rota)
    .map(([, opcoes]) => (opcoes.body ? JSON.parse(opcoes.body) : undefined));
}

export const CURSO = { id: 5, nome: "Ciência da Computação" };

export const USUARIO_API = {
  id: 1, nome: "Ana Souza", email: "ana@faesa.br", curso: CURSO, periodo: 3,
  cidade: "Vitória", bio: "", fotoUrl: null, criadoEm: "2026-10-01T10:00:00Z",
};

/** Usuário já no formato das telas (montarUsuario). */
export const USUARIO = {
  id: 1, nome: "Ana Souza", email: "ana@faesa.br", curso: CURSO.nome, cursoId: CURSO.id,
  periodo: "3º período", periodoNumero: 3, cidade: "Vitória", bio: "", fotoUrl: null, criadoEm: null,
};

export const CONFIGURACOES = {
  tema: "light", perfilPublico: true, mostrarEmail: false, permitirMensagens: true, novasOportunidades: true,
  mensagens: true, conexoes: true, publicacoes: true, resumoSemanal: false, reduzirAnimacoes: false,
};

export const AREAS = [{ id: 1, nome: "Tecnologia" }, { id: 2, nome: "Saúde" }, { id: 3, nome: "Direito" }];

export function pessoaResumo(id, nome, curso = CURSO, periodo = 4) {
  return { id, nome, curso, periodo };
}

export function oportunidade(id, titulo, extras = {}) {
  return {
    id, tipo: "PROJETO", titulo, descricao: `Descrição de ${titulo}`, modalidade: "REMOTO", status: "ABERTA",
    areas: [AREAS[0]], autor: pessoaResumo(2, "Bruno Lima"), participantes: 0, participando: false, salva: false,
    criadoEm: "2026-10-20T10:00:00Z", atualizadoEm: "2026-10-20T10:00:00Z", ...extras,
  };
}

export function habilidadePublicada(id, nome, extras = {}) {
  return {
    id, nome, categoria: "Tecnologia", nivel: "AVANCADO", descricao: `Sobre ${nome}`,
    disponibilidade: "PROJETOS_FREELAS", usuario: pessoaResumo(1, "Ana Souza"),
    criadoEm: "2026-10-20T10:00:00Z", atualizadoEm: "2026-10-20T10:00:00Z", ...extras,
  };
}

export function pessoa(id, nome, habilidades = []) {
  return { ...pessoaResumo(id, nome), cidade: "Serra", bio: `Bio de ${nome}`, email: null, fotoUrl: null, habilidades };
}
