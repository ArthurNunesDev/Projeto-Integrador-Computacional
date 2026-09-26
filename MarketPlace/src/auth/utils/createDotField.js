const DOT_FIELD_COUNT = 75;
const DOT_FIELD_COLORS = [
  "#a78bfa",
  "#f0d36b",
  "#ffffff",
  "#3264ae",
  "#3765a0",
  "#2458b4",
];

function createDotField() {
  return Array.from({ length: DOT_FIELD_COUNT }, (_, index) => {
    const flyDuration = Math.floor(Math.random() * 50) + 20; // 20s–70s
    const flyDelay = -((Math.floor(Math.random() * 100) + 1) / 10); // -0.1s a -10s
    const rotateDuration = Math.floor(Math.random() * 20) + 10; // 10s–30s
    const rotateDelay = -((Math.floor(Math.random() * 100) + 1) / 10);
    const originX = Math.floor(Math.random() * 30) - 15; // -15px a 14px
    const originY = Math.floor(Math.random() * 30) - 15;

    return {
      id: index,
      top: Math.random() * 100,
      left: Math.random() * 100,
      flyDuration,
      flyDelay,
      rotateDuration,
      rotateDelay,
      originX,
      originY,
      color:
        DOT_FIELD_COLORS[Math.floor(Math.random() * DOT_FIELD_COLORS.length)],
    };
  });
}

export { DOT_FIELD_COUNT, DOT_FIELD_COLORS, createDotField };
