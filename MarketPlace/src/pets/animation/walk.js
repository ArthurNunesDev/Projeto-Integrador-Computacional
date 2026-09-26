export function walk(tempo = 0, intensidade = 1, variante = "blue") {
  const p = Math.sin(tempo * (0.16 + intensidade * 0.035)),
    q = Math.sin(tempo * (0.32 + intensidade * 0.04)),
    pesado = variante === "red" ? 1.16 : 0.92;
  return {
    body: p * 2.2 * pesado,
    head: -p * 1.2,
    armFront: p * 26 * intensidade,
    armBack: -p * 22 * intensidade,
    legFront: -p * 24 * intensidade,
    legBack: p * 24 * intensidade,
    y: Math.abs(q) * -1.3,
    x: 0,
    lean: variante === "red" ? 2.5 : 0.8,
  };
}
