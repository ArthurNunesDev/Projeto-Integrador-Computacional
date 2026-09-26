/* =========================================================
   ARMAS — cada lutador pode invocar sua própria arma (cooldown
   longo). Enquanto empunhada (por alguns segundos), ganham
   acesso a golpes de arma extras e o desenho passa a mostrar a
   arma na mão — formas originais, sem ligação com nenhum
   personagem existente.
   ========================================================= */

export const ARMA_BLUE = { id: "espada", nome: "Espada" };
export const ARMA_RED = { id: "foice", nome: "Foice" };

/* Quanto tempo a arma fica empunhada depois de invocada. */
export const DURACAO_ARMA_MS = 9000;

export const INVOCAR_BLUE = {
  id: "invocar_espada",
  name: "Invocar Espada",
  animation: "invocar",
  kind: "arma_invocar",
  damage: 0,
  cooldown: 900,
  range: 0,
};

export const INVOCAR_RED = {
  id: "invocar_foice",
  name: "Invocar Foice",
  animation: "invocar",
  kind: "arma_invocar",
  damage: 0,
  cooldown: 900,
  range: 0,
};

export const GOLPES_ESPADA = [
  {
    id: "corte_vertical",
    name: "Corte Vertical",
    animation: "espada",
    kind: "arma_golpe",
    damage: 14,
    cooldown: 70,
    range: 82,
  },
  {
    id: "estocada",
    name: "Estocada",
    animation: "espada",
    kind: "arma_golpe",
    damage: 12,
    cooldown: 55,
    range: 92,
  },
];

export const GOLPES_FOICE = [
  {
    id: "ceifada",
    name: "Ceifada",
    animation: "foice",
    kind: "arma_golpe",
    damage: 13,
    cooldown: 65,
    range: 86,
  },
  {
    id: "giro_da_foice",
    name: "Giro da Foice",
    animation: "foice",
    kind: "arma_golpe",
    damage: 15,
    cooldown: 80,
    range: 78,
  },
];
