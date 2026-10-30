// Códigos dos enums da API e os textos exibidos nas telas. A API recebe e devolve os códigos.

import { formatarPeriodo } from "./perfil.js";

export const TIPOS = {
  PROJETO: "PROJETO", CONSULTORIA: "CONSULTORIA", PESQUISA: "PESQUISA", DESIGN: "DESIGN",
  FREELA: "FREELA", MONITORIA: "MONITORIA", AULA: "AULA", DIVULGACAO: "DIVULGAÇÃO",
};

const ICONES = {
  PROJETO: "💻", CONSULTORIA: "⚖️", PESQUISA: "📊", DESIGN: "🎨",
  FREELA: "💼", MONITORIA: "📚", AULA: "🎓", DIVULGACAO: "📣",
};

export const MODALIDADES = { REMOTO: "Remoto", HIBRIDO: "Híbrido", PRESENCIAL: "Presencial" };

export const NIVEIS = {
  INICIANTE: "Iniciante", INTERMEDIARIO: "Intermediário", AVANCADO: "Avançado", ESPECIALISTA: "Especialista",
};

export const DISPONIBILIDADES = {
  PROJETOS_FREELAS: "Projetos e freelas",
  PROJETOS_ACADEMICOS: "Projetos acadêmicos",
  MONITORIAS_AULAS: "Monitorias e aulas",
  COLABORACOES: "Colaborações",
};

// Categoria de habilidade é texto livre na API; estas são as sugestões das telas.
export const CATEGORIAS = ["Tecnologia", "Design", "Negócios", "Comunicação", "Saúde", "Direito", "Engenharia", "Outras"];

// A API aceita períodos de 1 a 20.
export const PERIODOS = Array.from({ length: 20 }, (_, i) => i + 1);

export function iniciais(nome, padrao = "") {
  return String(nome || "").split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || padrao;
}

/** "Curso · 3º período" a partir de um PessoaResumo/PessoaResposta da API. */
export function descreverCurso(pessoa) {
  return [pessoa?.curso?.nome, formatarPeriodo(pessoa?.periodo)].filter(Boolean).join(" · ");
}

/** OportunidadeResposta da API no formato dos cards. */
export function formatarOportunidade(api) {
  const areas = (api.areas || []).map((area) => area.nome);
  return {
    id: api.id,
    icon: ICONES[api.tipo] || "✦",
    tipo: TIPOS[api.tipo] || api.tipo,
    titulo: api.titulo,
    descricao: api.descricao,
    areas,
    area: areas.join(" + "),
    modalidade: MODALIDADES[api.modalidade] || api.modalidade,
    status: api.status,
    autorId: api.autor?.id,
    pessoa: api.autor?.nome || "",
    curso: api.autor?.curso?.nome || "",
    inicial: iniciais(api.autor?.nome),
    participando: Boolean(api.participando),
    salva: Boolean(api.salva),
  };
}
