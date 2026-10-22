/**
 * Namespaces all user-owned browser data by the authenticated account.
 * This is isolation for a GitHub Pages demo, not server-side security.
 */
export function chaveUsuario(chave, usuarioId) {
  const id = usuarioId == null || usuarioId === "" ? "sem-conta" : String(usuarioId);
  return `${chave}:${encodeURIComponent(id)}`;
}

export function lerJsonUsuario(chave, usuarioId, fallback) {
  try {
    const salvo = localStorage.getItem(chaveUsuario(chave, usuarioId));
    return salvo == null ? fallback : JSON.parse(salvo);
  } catch {
    return fallback;
  }
}

export function salvarJsonUsuario(chave, usuarioId, valor) {
  try {
    localStorage.setItem(chaveUsuario(chave, usuarioId), JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

/** Lê um valor sem interromper a interface se o armazenamento estiver indisponível. */
export function lerValorSeguro(chave, fallback = null) {
  try {
    return localStorage.getItem(chave) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Persiste um valor e informa se a operação foi concluída. */
export function salvarValorSeguro(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch {
    return false;
  }
}

/** Remove um valor sem interromper a navegação em caso de falha. */
export function removerValorSeguro(chave) {
  try {
    localStorage.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}
