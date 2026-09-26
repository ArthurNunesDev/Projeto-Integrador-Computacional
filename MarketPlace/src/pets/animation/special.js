const S = {
  charge: (t) => ({
    body: -5 - Math.sin(t * 0.35) * 3,
    head: -3,
    armFront: -55 - Math.sin(t * 0.42) * 10,
    armBack: 55 + Math.sin(t * 0.42) * 10,
    legFront: 15,
    legBack: -15,
    y: -1,
    x: 0,
    lean: 3,
  }),
  beam: (t) => ({
    body: 5,
    head: 2,
    armFront: 88,
    armBack: 62,
    legFront: -18,
    legBack: 20,
    y: Math.sin(t * 0.3),
    x: 3,
    lean: 12,
  }),
  spin: (t) => ({
    body: Math.sin(t * 0.45) * 35,
    head: Math.sin(t * 0.45) * 12,
    armFront: 95,
    armBack: -90,
    legFront: 72,
    legBack: -68,
    y: -3,
    x: Math.sin(t * 0.45) * 2,
    lean: 0,
  }),
  summon: (t) => ({
    body: -8,
    head: Math.sin(t * 0.2) * 5,
    armFront: -105 + Math.sin(t * 0.25) * 12,
    armBack: 105 - Math.sin(t * 0.25) * 12,
    legFront: 18,
    legBack: -18,
    y: -2,
    x: 0,
    lean: 2,
  }),
};
export function special(tempo = 0, estilo = "charge") {
  return (S[estilo] || S.charge)(tempo);
}
