/* =========================================================
   ATAQUES BÁSICOS — socos e chutes simples, sem nome chamativo,
   com cooldown bem curto. É disso que os dois vivem trocando a
   maior parte do tempo; as habilidades nomeadas (e a arma) são
   o tempero ocasional, não a base.

   `cooldown` aqui está na mesma unidade que os golpes especiais
   já usavam (compatível com STICKER_1_POWERS/STICKER_2_POWERS),
   convertida pra milissegundos reais em Stickers.jsx.
   ========================================================= */

export const BASICOS = [
  {
    id: "jab",
    name: "Jab",
    animation: "punch",
    kind: "basico",
    damage: 4,
    cooldown: 16,
    range: 62,
  },
  {
    id: "cruzado",
    name: "Cruzado",
    animation: "heavyPunch",
    kind: "basico",
    damage: 6,
    cooldown: 22,
    range: 66,
  },
  {
    id: "chute_baixo",
    name: "Chute Baixo",
    animation: "kick",
    kind: "basico",
    damage: 5,
    cooldown: 20,
    range: 72,
  },
  {
    id: "cotovelada",
    name: "Cotovelada",
    animation: "punch",
    kind: "basico",
    damage: 5,
    cooldown: 18,
    range: 46,
  },
  {
    id: "joelhada",
    name: "Joelhada",
    animation: "kick",
    kind: "basico",
    damage: 6,
    cooldown: 22,
    range: 50,
  },
];
