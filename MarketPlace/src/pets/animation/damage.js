export function damage(tempo = 0, intensidade = 1, direcao = 1) {
  const p = Math.sin(tempo * 1.15),
    q = Math.sin(tempo * 0.53);
  return {
    body: p * 8 * intensidade + direcao * 10,
    head: -p * 14 * intensidade,
    armFront: 75 + p * 30,
    armBack: -65 - p * 24,
    legFront: -45 - q * 20,
    legBack: 50 + q * 18,
    y: Math.abs(p) * 3,
    x: p * 2,
    lean: direcao * 20,
  };
}
