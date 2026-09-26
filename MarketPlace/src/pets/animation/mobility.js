/* =========================================================
   MOBILIDADE — avanço instantâneo: em vez de correr até o
   oponente, o lutador desaparece e reaparece bem perto,
   golpeando na sequência. Cooldown longo, pra continuar sendo
   um recurso raro e de impacto, não um teleporte-metralhadora.
   ========================================================= */

export const PASSO_RELAMPAGO = {
  id: "passo_relampago",
  name: "Passo Relâmpago",
  animation: "avanco",
  kind: "mobilidade",
  damage: 10,
  cooldown: 500,
  range: 70,
};
