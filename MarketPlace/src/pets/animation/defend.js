export function defend(tempo = 0, intensidade = 1, variante = "blue") {
  const p = Math.sin(tempo * 0.24);
  return {
    body: p * 2,
    head: -p * 1.5,
    armFront: -58 + p * 8,
    armBack: 42 - p * 7,
    legFront: -10,
    legBack: 10,
    y: -1 + Math.abs(p),
    x: 0,
    lean: variante === "red" ? 4 : 2,
    shield: 1,
    shieldPulse: 1 + Math.sin(tempo * 0.18) * 0.08 * intensidade,
  };
}
