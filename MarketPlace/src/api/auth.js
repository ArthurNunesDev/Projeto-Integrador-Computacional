import { ApiError } from './client'

const CHAVE_USUARIOS = 'marketfaesa-users'
const CHAVE_SESSAO = 'marketfaesa-auth'

function lerUsuarios() {
  try {
    const usuarios = JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || '[]')
    return Array.isArray(usuarios) ? usuarios : []
  } catch {
    return []
  }
}

function salvarUsuarios(usuarios) {
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios))
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/** Retorna a sessão local salva neste navegador, sem depender do backend. */
export function obterSessaoLocal() {
  try {
    const usuario = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null')
    return usuario && typeof usuario === 'object' ? usuario : null
  } catch {
    return null
  }
}

/** Cadastro demonstrativo local. As contas existem somente neste navegador. */
export async function cadastrar({ nome, email, senha }) {
  const usuarios = lerUsuarios()
  const emailNormalizado = normalizarEmail(email)

  if (usuarios.some((usuario) => normalizarEmail(usuario.email) === emailNormalizado)) {
    throw new ApiError({ status: 409, mensagem: 'Este e-mail já está cadastrado.' })
  }

  const usuario = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nome: String(nome || '').trim(),
    email: emailNormalizado,
    senha,
    curso: { nome: '' },
    periodo: '',
    cidade: '',
    bio: '',
    fotoUrl: null,
    criadoEm: new Date().toISOString(),
  }

  try {
    salvarUsuarios([...usuarios, usuario])
  } catch {
    throw new ApiError({ status: 0, mensagem: 'Não foi possível salvar a conta neste navegador.' })
  }
  return { usuario: { ...usuario, senha: undefined } }
}

/** Login demonstrativo local: valida a conta salva no localStorage. */
export async function login({ email, senha }) {
  const emailNormalizado = normalizarEmail(email)
  const usuario = lerUsuarios().find(
    (item) => normalizarEmail(item.email) === emailNormalizado && item.senha === senha,
  )

  if (!usuario) {
    throw new ApiError({ status: 401, mensagem: 'E-mail ou senha inválidos.' })
  }

  const usuarioSemSenha = { ...usuario };
  delete usuarioSemSenha.senha
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuarioSemSenha))
  } catch {
    throw new ApiError({ status: 0, mensagem: 'Não foi possível manter a sessão neste navegador.' })
  }

  return { token: null, usuario: usuarioSemSenha }
}

/** Logout local: encerra a sessão salva neste navegador. */
export function sair() {
  try {
    localStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // sem storage não há sessão a limpar
  }
}
