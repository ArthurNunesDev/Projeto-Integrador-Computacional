// Perfil exibido nas telas: vem da API (UsuarioResposta) e recebe por cima as
// edições que o usuário fez neste navegador, guardadas por id do usuário.
// TODO: enviar essas edições para PUT /api/usuarios/me quando a rota existir e
// remover o armazenamento local.

const CHAVE_PERFIL = "marketfaesa-perfil";
const CHAVE_HABILIDADES = "marketfaesa-habilidades";

// Campos do perfil que a tela permite editar (o e-mail é o login e não muda aqui).
const CAMPOS_EDITAVEIS = ["nome", "curso", "periodo", "cidade", "bio"];

function chavePerfil(id) {
  return `${CHAVE_PERFIL}:${id}`;
}

function lerPerfilLocal(id) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chavePerfil(id)) || "{}");
    return salvo && typeof salvo === "object" ? salvo : {};
  } catch {
    return {};
  }
}

// Versões anteriores guardavam as edições por e-mail (minúsculo); move para a chave por id.
function migrarPerfilPorEmail(id, email) {
  if (!email) return;
  try {
    const chaveEmail = chavePerfil(email.trim().toLowerCase());
    const salvoPorEmail = localStorage.getItem(chaveEmail);
    if (salvoPorEmail === null || localStorage.getItem(chavePerfil(id)) !== null) return;
    localStorage.setItem(chavePerfil(id), salvoPorEmail);
    localStorage.removeItem(chaveEmail);
  } catch {
    // sem storage não há o que migrar
  }
}

/** Guarda as edições locais do perfil e devolve só os campos editáveis aplicados. */
export function salvarPerfilLocal(id, dados) {
  const aplicados = {};
  for (const campo of CAMPOS_EDITAVEIS) {
    if (typeof dados?.[campo] === "string") aplicados[campo] = dados[campo];
  }

  try {
    localStorage.setItem(chavePerfil(id), JSON.stringify({ ...lerPerfilLocal(id), ...aplicados }));
  } catch {
    // sem storage as edições valem só nesta sessão
  }

  return aplicados;
}

export function formatarPeriodo(periodo) {
  return periodo ? `${periodo}º período` : "";
}

/** Converte o usuário da API para o formato das telas (textos) e aplica as edições locais. */
export function montarUsuario(api) {
  const usuario = {
    id: api.id,
    nome: api.nome || "",
    email: api.email || "",
    curso: api.curso?.nome || "",
    periodo: formatarPeriodo(api.periodo),
    cidade: api.cidade || "",
    bio: api.bio || "",
    fotoUrl: api.fotoUrl || null,
    criadoEm: api.criadoEm || null,
  };

  migrarPerfilPorEmail(api.id, api.email);
  const local = lerPerfilLocal(api.id);
  for (const campo of CAMPOS_EDITAVEIS) {
    if (typeof local[campo] === "string") usuario[campo] = local[campo];
  }

  return usuario;
}

export function calcularProgressoPerfil(usuario) {
  if (!usuario?.email) return 0;

  let habilidades = [];
  try {
    habilidades = JSON.parse(localStorage.getItem(CHAVE_HABILIDADES) || "[]");
  } catch {
    // localStorage indisponível ou com JSON inválido: considera sem habilidades
  }

  const campos = [
    ...["nome", "email", "curso", "periodo", "cidade", "bio"].map((campo) =>
      Boolean(String(usuario[campo] || "").trim()),
    ),
    Array.isArray(habilidades) && habilidades.some((item) => item?.nome?.trim()),
  ];
  return Math.round((campos.filter(Boolean).length / campos.length) * 100);
}
