/* =========================================================
   COMBOS — acertos seguidos dentro de uma janela curta contam
   como sequência e ganham um bônus de dano crescente (com teto,
   pra não ficar absurdo). A janela reseta o contador se o
   lutador demorar demais pra acertar de novo.
   ========================================================= */

const JANELA_MS = 1100;
const BONUS_POR_ACERTO = 0.12;
const BONUS_MAXIMO = 0.6;

export function registrarAcerto(fighter, now) {
  if (fighter.combo && now < fighter.combo.until) {
    fighter.combo.count += 1;
  } else {
    fighter.combo = { count: 1, until: 0 };
  }
  fighter.combo.until = now + JANELA_MS;
  return fighter.combo.count;
}

export function bonusCombo(count) {
  return 1 + Math.min(BONUS_MAXIMO, (count - 1) * BONUS_POR_ACERTO);
}
