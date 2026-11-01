// Perfil exibido nas telas: vem da API (UsuarioResposta) e é salvo com PUT /api/usuarios/me.

import { chaveUsuario } from "./storage.js";

export function formatarPeriodo(periodo) {
  return periodo ? `${periodo}º período` : "";
}

/** Converte o usuário da API para o formato das telas (textos), guardando também os valores crus. */
export function montarUsuario(api) {
  return {
    id: api.id,
    nome: api.nome || "",
    email: api.email || "",
    curso: api.curso?.nome || "",
    cursoId: api.curso?.id ?? null,
    periodo: formatarPeriodo(api.periodo),
    periodoNumero: api.periodo ?? null,
    cidade: api.cidade || "",
    bio: api.bio || "",
    fotoUrl: api.fotoUrl || null,
    criadoEm: api.criadoEm || null,
  };
}

/** Corpo completo do PUT /api/usuarios/me: o perfil atual com as alterações por cima. */
export function corpoAtualizacao(usuario, alteracoes) {
  return {
    nome: usuario.nome,
    cursoId: usuario.cursoId,
    periodo: usuario.periodoNumero,
    cidade: usuario.cidade,
    bio: usuario.bio,
    fotoUrl: usuario.fotoUrl,
    ...alteracoes,
  };
}

/** Percentual de preenchimento: campos do perfil + ter ao menos uma habilidade publicada. */
export function calcularProgressoPerfil(usuario, quantidadeHabilidades = 0) {
  if (!usuario?.email) return 0;

  const campos = [
    ...["nome", "email", "curso", "periodo", "cidade", "bio"].map((campo) =>
      Boolean(String(usuario[campo] || "").trim()),
    ),
    quantidadeHabilidades > 0,
  ];
  return Math.round((campos.filter(Boolean).length / campos.length) * 100);
}

const CHAVE_CONQUISTA_PERFIL = "marketfaesa-perfil-completo-conquista";

/** Indica se esta conta já recebeu a animação de conclusão do perfil. */
export function conquistaPerfilExibida(usuario) {
  if (!usuario?.id) return false;
  try {
    return localStorage.getItem(chaveUsuario(CHAVE_CONQUISTA_PERFIL, usuario.id)) === "1";
  } catch {
    return false;
  }
}

/** Registra a conquista por conta para evitar repetições a cada edição. */
export function marcarConquistaPerfilExibida(usuario) {
  if (!usuario?.id) return;
  try {
    localStorage.setItem(chaveUsuario(CHAVE_CONQUISTA_PERFIL, usuario.id), "1");
  } catch {
    // A animação ainda pode ser exibida nesta sessão se o armazenamento falhar.
  }
}
