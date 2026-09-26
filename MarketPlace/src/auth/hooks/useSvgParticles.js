import { useEffect } from "react";

export default function useSvgParticles() {
useEffect(() => {
  const svg = document.querySelector(".motion-particles");
  if (!svg) return undefined;

  const interactiveGroups = Array.from(
    svg.querySelectorAll(".motion-particle"),
  );

  if (!interactiveGroups.length) return undefined;

  const particles = interactiveGroups.map((element, index) => {
    const circle = element.querySelector("circle:first-child");
    const originalX = Number(circle?.getAttribute("cx") || 0);
    const originalY = Number(circle?.getAttribute("cy") || 0);
    const point = svg.createSVGPoint();
    point.x = originalX;
    point.y = originalY;
    const matrix = element.getScreenCTM();
    const screenPoint = matrix ? point.matrixTransform(matrix) : point;

    return {
      element,
      x: screenPoint.x,
      y: screenPoint.y,
      vx: 0,
      vy: 0,
      seed: Math.random() * Math.PI * 2,
      dragging: false,
      pointerId: null,
      lastX: screenPoint.x,
      lastY: screenPoint.y,
      lastTime: performance.now(),
    };
  });

  let animationFrame = null;
  let active = null;
  let destroyed = false;

  function getSvgPoint(clientX, clientY) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : point;
  }

  function setParticleTransform(particle, clientX, clientY) {
    const point = getSvgPoint(clientX, clientY);
    const circle = particle.element.querySelector("circle:first-child");
    const baseX = Number(circle?.getAttribute("cx") || 0);
    const baseY = Number(circle?.getAttribute("cy") || 0);
    particle.element.style.transformBox = "fill-box";
    particle.element.style.transformOrigin = "center";
    particle.element.style.transform = `translate(${point.x - baseX}px, ${point.y - baseY}px)`;
  }

  function begin(event, particle) {
    if (destroyed) return;
    event.preventDefault();
    event.stopPropagation();

    const now = performance.now();
    particle.dragging = true;
    particle.pointerId = event.pointerId;
    particle.vx = 0;
    particle.vy = 0;
    particle.lastX = event.clientX;
    particle.lastY = event.clientY;
    particle.lastTime = now;
    active = particle;

    particle.element.style.animation = "none";
    particle.element.classList.add("is-svg-dragging");

    try {
      particle.element.setPointerCapture(event.pointerId);
    } catch {
      // Alguns navegadores não permitem captura em SVG.
    }
  }

  function move(event, particle) {
    if (
      destroyed ||
      !active ||
      active !== particle ||
      particle.pointerId !== event.pointerId
    ) {
      return;
    }

    const now = performance.now();
    const dt = Math.max(8, now - particle.lastTime);
    const dx = event.clientX - particle.lastX;
    const dy = event.clientY - particle.lastY;

    particle.vx = dx / dt;
    particle.vy = dy / dt;
    particle.lastX = event.clientX;
    particle.lastY = event.clientY;
    particle.lastTime = now;
    particle.x = event.clientX;
    particle.y = event.clientY;

    setParticleTransform(particle, event.clientX, event.clientY);
  }

  function release(event, particle) {
    if (
      destroyed ||
      !active ||
      active !== particle ||
      particle.pointerId !== event.pointerId
    ) {
      return;
    }

    const now = performance.now();
    const dt = Math.max(8, now - particle.lastTime);
    const releaseVX = (event.clientX - particle.lastX) / dt;
    const releaseVY = (event.clientY - particle.lastY) / dt;

    if (Math.abs(releaseVX) > 0.01 || Math.abs(releaseVY) > 0.01) {
      particle.vx = releaseVX;
      particle.vy = releaseVY;
    }

    const speed = Math.hypot(particle.vx, particle.vy);
    const maxSpeed = 1.8;
    if (speed > maxSpeed) {
      const factor = maxSpeed / speed;
      particle.vx *= factor;
      particle.vy *= factor;
    }

    particle.vx *= 16;
    particle.vy *= 16;
    particle.dragging = false;
    particle.pointerId = null;
    active = null;
    particle.element.classList.remove("is-svg-dragging");

    try {
      particle.element.releasePointerCapture(event.pointerId);
    } catch {
      // A captura pode já ter sido liberada.
    }
  }

  particles.forEach((particle) => {
    particle.element.style.cursor = "grab";
    particle.element.style.pointerEvents = "auto";
    particle.element.addEventListener("pointerdown", (event) =>
      begin(event, particle),
    );
    particle.element.addEventListener("pointermove", (event) =>
      move(event, particle),
    );
    particle.element.addEventListener("pointerup", (event) =>
      release(event, particle),
    );
    particle.element.addEventListener("pointercancel", (event) =>
      release(event, particle),
    );
  });

  let lastTime = performance.now();

  function animate(time) {
    if (destroyed) return;
    const delta = Math.min(32, Math.max(8, time - lastTime));
    lastTime = time;

    const rect = svg.getBoundingClientRect();

    for (const particle of particles) {
      if (particle.dragging) continue;

      const factor = delta / 16.67;
      const point = getSvgPoint(particle.x, particle.y);
      const wanderX = Math.sin(time * 0.00055 + particle.seed) * 0.018;
      const wanderY = Math.cos(time * 0.00043 + particle.seed * 1.7) * 0.018;

      particle.vx += wanderX * factor;
      particle.vy += wanderY * factor;
      particle.vx *= Math.pow(0.986, factor);
      particle.vy *= Math.pow(0.986, factor);

      const nextX = particle.x + particle.vx * factor;
      const nextY = particle.y + particle.vy * factor;

      const margin = 12;
      if (nextX < rect.left - margin) particle.x = rect.right + margin;
      else if (nextX > rect.right + margin) particle.x = rect.left - margin;
      else particle.x = nextX;

      if (nextY < rect.top - margin) particle.y = rect.bottom + margin;
      else if (nextY > rect.bottom + margin) particle.y = rect.top - margin;
      else particle.y = nextY;

      const local = getSvgPoint(particle.x, particle.y);
      const circle = particle.element.querySelector("circle:first-child");
      const baseX = Number(circle?.getAttribute("cx") || 0);
      const baseY = Number(circle?.getAttribute("cy") || 0);
      particle.element.style.transform = `translate(${local.x - baseX}px, ${local.y - baseY}px)`;
    }

    animationFrame = requestAnimationFrame(animate);
  }

  animationFrame = requestAnimationFrame(animate);

  return () => {
    destroyed = true;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);

    particles.forEach((particle) => {
      particle.element.style.pointerEvents = "";
      particle.element.style.cursor = "";
      particle.element.style.animation = "";
      particle.element.style.transform = "";
      particle.element.classList.remove("is-svg-dragging");
    });
  };
}, []);

}
