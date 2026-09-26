export function jump(tempo = 0, vy = 0, variante = "blue") {
  const subida = vy < -1,
    queda = vy > 2,
    t = Math.sin(tempo * 0.18);
  if (subida)
    return {
      body: -6 + t * 2,
      head: -t * 2,
      armFront: -55 + t * 8,
      armBack: 38 - t * 8,
      legFront: 48,
      legBack: -44,
      y: -1,
      x: 0,
      lean: variante === "red" ? 6 : 3,
    };
  if (queda)
    return {
      body: 10,
      head: 5,
      armFront: 62,
      armBack: -54,
      legFront: -58,
      legBack: 52,
      y: 3,
      x: 0,
      lean: 12,
    };
  return {
    body: t * 5,
    head: -t * 2,
    armFront: 18 + t * 15,
    armBack: -18 - t * 15,
    legFront: -28 - t * 10,
    legBack: 28 + t * 10,
    y: -2,
    x: 0,
    lean: 5,
  };
}
