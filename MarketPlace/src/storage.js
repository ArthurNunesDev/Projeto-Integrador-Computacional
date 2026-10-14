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
