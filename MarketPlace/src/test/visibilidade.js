// Simula a aba do navegador ficando oculta ou visível (document.hidden + visibilitychange).
let oculta = false;

Object.defineProperty(document, "hidden", { configurable: true, get: () => oculta });
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (oculta ? "hidden" : "visible") });

export function definirAbaOculta(valor) {
  oculta = valor;
  document.dispatchEvent(new Event("visibilitychange"));
}

/** Volta ao estado visível sem disparar evento (use no afterEach). */
export function restaurarVisibilidade() {
  oculta = false;
}
