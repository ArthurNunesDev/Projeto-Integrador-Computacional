const P = {
  punch: {
    prep: {
      body: -7,
      head: -4,
      armFront: -48,
      armBack: 28,
      legFront: 18,
      legBack: -18,
      lean: 3,
    },
    hit: {
      body: 8,
      head: 5,
      armFront: 84,
      armBack: -18,
      legFront: -12,
      legBack: 22,
      lean: 12,
    },
  },
  heavyPunch: {
    prep: {
      body: -12,
      head: -7,
      armFront: -78,
      armBack: 42,
      legFront: 25,
      legBack: -25,
      lean: 1,
    },
    hit: {
      body: 14,
      head: 7,
      armFront: 110,
      armBack: -26,
      legFront: -18,
      legBack: 30,
      lean: 17,
    },
  },
  kick: {
    prep: {
      body: -10,
      head: -3,
      armFront: -32,
      armBack: 32,
      legFront: -78,
      legBack: 25,
      lean: 5,
    },
    hit: {
      body: 12,
      head: 4,
      armFront: 35,
      armBack: -38,
      legFront: 92,
      legBack: -22,
      lean: 14,
    },
  },
  slash: {
    prep: {
      body: -15,
      head: -6,
      armFront: -90,
      armBack: 28,
      legFront: 20,
      legBack: -20,
      lean: 0,
    },
    hit: {
      body: 16,
      head: 8,
      armFront: 115,
      armBack: -34,
      legFront: -16,
      legBack: 25,
      lean: 16,
    },
  },
  rush: {
    prep: {
      body: 16,
      head: 7,
      armFront: 65,
      armBack: 38,
      legFront: -40,
      legBack: 48,
      lean: 18,
    },
    hit: {
      body: 24,
      head: 10,
      armFront: 105,
      armBack: -70,
      legFront: 65,
      legBack: -55,
      lean: 25,
    },
  },
};
const b = (a, c, t) => a + (c - a) * t;
export function attack(tempo = 0, fase = 0.5, estilo = "punch") {
  const x = P[estilo] || P.punch,
    t = Math.max(0, Math.min(1, fase)),
    e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return {
    body: b(x.prep.body, x.hit.body, e) + Math.sin(tempo * 0.8) * 2,
    head: b(x.prep.head, x.hit.head, e),
    armFront: b(x.prep.armFront, x.hit.armFront, e),
    armBack: b(x.prep.armBack, x.hit.armBack, e),
    legFront: b(x.prep.legFront, x.hit.legFront, e),
    legBack: b(x.prep.legBack, x.hit.legBack, e),
    y: Math.sin(t * Math.PI) * -2,
    x: e * 2,
    lean: b(x.prep.lean, x.hit.lean, e),
  };
}
