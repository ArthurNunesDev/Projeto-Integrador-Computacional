export function fall(tempo = 0, intensidade = 1, direcao = 1) {
  const p = Math.min(1, tempo * 0.06),
    s = Math.sin(p * Math.PI * 1.2);
  return {
    body: direcao * p * 88,
    head: direcao * p * 30,
    armFront: 45 + s * 60,
    armBack: -35 - s * 55,
    legFront: -25 - s * 35,
    legBack: 28 + s * 40,
    y: p * 8,
    x: p * direcao * 3 * intensidade,
    lean: direcao * p * 30,
  };
}
