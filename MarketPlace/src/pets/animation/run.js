export function run(tempo = 0, velocidade = 1, variante = "blue") {
  const phase = tempo * (0.28 + velocidade * 0.08),
    p = Math.sin(phase),
    q = Math.sin(phase + Math.PI / 2),
    pesado = variante === "red" ? 1.08 : 0.92;
  return {
    body: 7 + p * 3.8 * pesado,
    head: -p * 3,
    armFront: -38 + p * 52,
    armBack: 34 - p * 48,
    legFront: -38 - p * 42,
    legBack: 35 + p * 42,
    y: Math.abs(q) * -2.8,
    x: p * -1.5,
    lean: 10 + velocidade * 5,
  };
}
