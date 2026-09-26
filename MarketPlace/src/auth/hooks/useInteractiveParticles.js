import { useEffect, useRef } from "react";

export default function useInteractiveParticles() {
  const particleLayerRef = useRef(null);
  const colorTakeoverRef = useRef(null);
  const particlesRef = useRef([]);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef(null);
  const pointerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const spawnDelayRef = useRef(1100);

  const PARTICLE_TARGET = 48;
  const MAX_PARTICLES = 72;
  const ORBIT_RECOVERY_FORCE = 0.035;
  const ORBIT_DAMPING = 0.93;
  const FREE_DAMPING = 0.9972;
  const MIN_FREE_SPEED = 0.055;
  const RETURN_DELAY = 520;
  const GRAVITY = 0.012;
  const BOUNCE = 0.94;
  const MAX_LAUNCH_SPEED = 25;
  const DRAG_THRESHOLD = 5;

  /* =====================================================
   - segurar uma partícula por mais de 5s começa o "carregamento"
   - o raio cresce bem devagar no início e acelera com o tempo
   - ao atingir o raio de explosão, estoura em vários fragmentos
   - 25% de chance (sorteado ao começar a carregar) de virar uma
     "mega" partícula: cresce até cobrir a tela inteira, explode,
     e o fundo assume a cor dela por alguns segundos
   ===================================================== */

  const HOLD_TO_CHARGE_MS = 5000;
  const CHARGE_EXPLODE_RADIUS = 95;
  const CHARGE_GROWTH_RATE = 2.8;
  const CHARGE_GROWTH_EXP = 2.15;
  // A "mega" cresce muito mais rápido, senão levaria tempo demais pra
  // cobrir a tela inteira usando a mesma curva das partículas normais.
  const MEGA_GROWTH_RATE = 6.8;
  // Multiplicador sobre a diagonal da tela: garante que o círculo cubra
  // qualquer canto, não importa de onde a partícula foi pega.
  const MEGA_RADIUS_FACTOR = 0.62;
  const MEGA_CHANCE = 0.25;
  const MEGA_COLOR_HOLD_MS = 10000;
  // A explosão agora é proporcional ao tamanho que a partícula atingiu.
  // Em milhares seria inviável (cada fragmento é um elemento real no DOM),
  // então usamos "fragmentos por pixel de raio" com um teto de segurança
  // pra não travar o navegador quando uma mega-partícula gigante estoura.
  const FRAGMENTS_PER_RADIUS_PX = 1.15;
  const FRAGMENT_COUNT_MIN = 40;
  const FRAGMENT_COUNT_MAX_NORMAL = 170;
  const FRAGMENT_COUNT_MAX_MEGA = 360;
  const SHRINK_EASE = 0.12;
  // Duração do "pop" de explosão (calculado no JS, ver render()).
  const POP_DURATION_MS = 220;

  // Cores hexadecimais correspondentes às classes de cor das partículas
  // "vivas" — usadas pra colorir o fundo quando uma mega-partícula explode.
  const COLOR_HEX = {
    purple: "#a78bfa",
    gold: "#f0d36b",
    white: "#ffffff",
    "blue-1": "#3264ae",
    "blue-2": "#3765a0",
    "blue-3": "#2458b4",
  };

  useEffect(() => {
    const layer = particleLayerRef.current;
    if (!layer) return undefined;

    const colors = ["purple", "gold", "white", "blue-1", "blue-2", "blue-3"];
    let destroyed = false;

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    // Cor vívida e aleatória pra cada fragmento da explosão — é isso que
    // dá o efeito de "estourar em partículas menores de cores diferentes".
    function randomFragmentColor() {
      const hue = Math.floor(random(0, 360));
      const saturation = Math.floor(random(65, 95));
      const lightness = Math.floor(random(55, 78));
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function getBounds() {
      return {
        width: Math.max(1, layer.clientWidth),
        height: Math.max(1, layer.clientHeight),
      };
    }

    function getOrbitLimits(width, height) {
      return {
        x: Math.max(110, width * 0.43),
        y: Math.max(95, height * 0.4),
      };
    }

    function createElement(particle) {
      const element = document.createElement("button");
      element.type = "button";

      if (particle.kind === "fragment") {
        element.className =
          "interactive-particle interactive-particle-fragment";
        element.style.color = particle.color;
      } else {
        element.className = `interactive-particle interactive-particle-${particle.color}`;
      }

      element.setAttribute("aria-label", "Partícula decorativa interativa");
      element.dataset.particleId = String(particle.id);
      element.style.width = `${particle.radius * 2}px`;
      element.style.height = `${particle.radius * 2}px`;
      element.style.opacity = "0";

      const glow = document.createElement("span");
      glow.className = "interactive-particle-glow";
      element.appendChild(glow);

      const core = document.createElement("span");
      core.className = "interactive-particle-core";
      element.appendChild(core);

      function beginDrag(event) {
        if (destroyed || particle.state === "removed") return;

        event.preventDefault();
        event.stopPropagation();

        particle.state = "dragging";
        particle.dragging = true;
        particle.pointerId = event.pointerId;
        particle.vx = 0;
        particle.vy = 0;
        particle.freeTime = 0;
        particle.returnTime = 0;

        const now = performance.now();

        particle.chargeStart = now;
        particle.charging = false;
        particle.isMegaCandidate = false;
        particle.shrinking = false;
        pointerRef.current = {
          particle,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          lastMoveTime: now,
          lastVX: 0,
          lastVY: 0,
          moved: false,
        };

        element.classList.add("is-dragging");

        try {
          element.setPointerCapture(event.pointerId);
        } catch {
          // O navegador pode recusar a captura em alguns contextos.
        }
      }

      function moveDrag(event) {
        const pointer = pointerRef.current;
        if (
          destroyed ||
          !pointer ||
          pointer.particle !== particle ||
          pointer.pointerId !== event.pointerId
        ) {
          return;
        }

        const rect = layer.getBoundingClientRect();
        const now = performance.now();
        const dt = Math.max(8, now - pointer.lastMoveTime);
        const dx = event.clientX - pointer.lastX;
        const dy = event.clientY - pointer.lastY;
        const totalDistance = Math.hypot(
          event.clientX - pointer.startX,
          event.clientY - pointer.startY,
        );

        if (totalDistance >= DRAG_THRESHOLD) {
          pointer.moved = true;
        }

        const vx = (dx / dt) * 16.67;
        const vy = (dy / dt) * 16.67;

        particle.x = event.clientX - rect.left;
        particle.y = event.clientY - rect.top;
        particle.vx = vx;
        particle.vy = vy;

        pointer.lastVX = vx;
        pointer.lastVY = vy;
        pointer.lastX = event.clientX;
        pointer.lastY = event.clientY;
        pointer.lastMoveTime = now;
      }

      function releaseDrag(event) {
        const pointer = pointerRef.current;
        if (
          destroyed ||
          !pointer ||
          pointer.particle !== particle ||
          pointer.pointerId !== event.pointerId
        ) {
          return;
        }

        if (particle.charging) {
          // Soltou antes de explodir — cancela o carregamento e a
          // partícula encolhe suavemente de volta ao tamanho normal.
          particle.charging = false;
          particle.shrinking = true;
          particle.chargeStart = null;
          particle.isMegaCandidate = false;
          particle.dragging = false;
          particle.pointerId = null;
          particle.vx = 0;
          particle.vy = 0;
          particle.returnTime = 0;
          particle.state = particle.kind === "orbit" ? "returning" : "free";

          particle.element?.classList.remove(
            "is-dragging",
            "is-charging",
            "is-mega",
          );

          pointerRef.current = null;

          try {
            element.releasePointerCapture(event.pointerId);
          } catch {
            // Captura já pode ter sido liberada pelo navegador.
          }

          return;
        }

        const now = performance.now();
        const dt = Math.max(8, now - pointer.lastMoveTime);
        const releaseVX = ((event.clientX - pointer.lastX) / dt) * 16.67;
        const releaseVY = ((event.clientY - pointer.lastY) / dt) * 16.67;

        if (Math.abs(releaseVX) > 0.01 || Math.abs(releaseVY) > 0.01) {
          particle.vx = releaseVX;
          particle.vy = releaseVY;
        } else {
          particle.vx = pointer.lastVX;
          particle.vy = pointer.lastVY;
        }

        const moved =
          pointer.moved ||
          Math.hypot(
            event.clientX - pointer.startX,
            event.clientY - pointer.startY,
          ) >= DRAG_THRESHOLD;

        particle.dragging = false;
        particle.pointerId = null;
        particle.freeTime = 0;
        particle.returnTime = 0;

        if (!moved) {
          particle.vx = 0;
          particle.vy = 0;
          particle.state = particle.kind === "orbit" ? "orbit" : "free";
          element.classList.remove("is-dragging");
          pointerRef.current = null;

          try {
            element.releasePointerCapture(event.pointerId);
          } catch {
            // Captura já pode ter sido liberada pelo navegador.
          }
          return;
        }

        let speed = Math.hypot(particle.vx, particle.vy);
        if (speed > MAX_LAUNCH_SPEED) {
          const factor = MAX_LAUNCH_SPEED / speed;
          particle.vx *= factor;
          particle.vy *= factor;
          speed = MAX_LAUNCH_SPEED;
        }

        if (speed < 0.35) {
          const directionX = event.clientX - pointer.startX;
          const directionY = event.clientY - pointer.startY;
          const directionLength = Math.hypot(directionX, directionY);

          if (directionLength > 0) {
            particle.vx = (directionX / directionLength) * 0.9;
            particle.vy = (directionY / directionLength) * 0.9;
          }
        }

        particle.vx *= 1.12;
        particle.vy *= 1.12;
        particle.state = "free";
        particle.born = now;
        particle.life = Math.max(particle.life, 30000);

        element.classList.remove("is-dragging");
        element.classList.add("was-launched");
        window.setTimeout(() => {
          if (!destroyed) element.classList.remove("was-launched");
        }, 450);

        pointerRef.current = null;

        try {
          element.releasePointerCapture(event.pointerId);
        } catch {
          // Captura já pode ter sido liberada pelo navegador.
        }
      }

      element.addEventListener("pointerdown", beginDrag);
      element.addEventListener("pointermove", moveDrag);
      element.addEventListener("pointerup", releaseDrag);
      element.addEventListener("pointercancel", releaseDrag);

      particle.element = element;
      layer.appendChild(element);
    }

    function createParticle(options = {}) {
      const { width, height } = getBounds();
      const limits = getOrbitLimits(width, height);
      const kind = options.kind || "orbit";
      const radius = options.radius ?? random(2.8, 5.5);
      const color =
        options.color || colors[Math.floor(Math.random() * colors.length)];
      const orbitAngle = options.orbitAngle ?? random(0, Math.PI * 2);
      const orbitRadiusX =
        options.orbitRadiusX ?? random(limits.x * 0.52, limits.x);
      const orbitRadiusY =
        options.orbitRadiusY ?? random(limits.y * 0.52, limits.y);

      let x;
      let y;
      let vx = 0;
      let vy = 0;

      if (options.x !== undefined && options.y !== undefined) {
        x = options.x;
        y = options.y;
        vx = options.vx ?? 0;
        vy = options.vy ?? 0;
      } else if (kind === "orbit") {
        x = width / 2 + Math.cos(orbitAngle) * orbitRadiusX;
        y = height / 2 + Math.sin(orbitAngle) * orbitRadiusY;
      } else {
        const margin = 24;
        x = random(margin, Math.max(margin + 1, width - margin));
        y = random(margin, Math.max(margin + 1, height - margin));
        vx = random(-0.28, 0.28);
        vy = random(-0.28, 0.28);
      }

      const particle = {
        id: particleIdRef.current++,
        kind,
        state: kind === "orbit" ? "orbit" : "free",
        x,
        y,
        vx,
        vy,
        radius,
        baseRadius: radius,
        mass: radius * radius,
        color,
        alpha: options.alpha ?? random(0.42, 0.9),
        born: performance.now(),
        life: options.life ?? random(22000, 34000),
        orbitAngle,
        orbitRadiusX,
        orbitRadiusY,
        orbitSpeed: options.orbitSpeed ?? random(0.0001, 0.00025),
        orbitPhase: random(0, Math.PI * 2),
        element: null,
        dragging: false,
        pointerId: null,
        freeTime: 0,
        returnTime: 0,
        chargeStart: null,
        charging: false,
        chargeElapsed: 0,
        isMegaCandidate: false,
        shrinking: false,
      };

      createElement(particle);
      particlesRef.current.push(particle);
      return particle;
    }

    function removeParticle(particle) {
      const index = particlesRef.current.indexOf(particle);
      if (index === -1) return;

      if (pointerRef.current?.particle === particle) {
        pointerRef.current = null;
      }

      particlesRef.current.splice(index, 1);
      particle.state = "removed";
      particle.element?.remove();
    }

    function updateOrbit(particle, delta, width, height) {
      const limits = getOrbitLimits(width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      particle.orbitRadiusX = Math.min(particle.orbitRadiusX, limits.x);
      particle.orbitRadiusY = Math.min(particle.orbitRadiusY, limits.y);

      particle.x =
        centerX + Math.cos(particle.orbitAngle) * particle.orbitRadiusX;
      particle.y =
        centerY + Math.sin(particle.orbitAngle) * particle.orbitRadiusY;

      particle.orbitAngle += particle.orbitSpeed * delta;
    }

    function updateFree(particle, delta, width, height) {
      const factor = delta / 16.67;

      particle.vy += GRAVITY * factor;
      particle.x += particle.vx * factor;
      particle.y += particle.vy * factor;

      const damping = Math.pow(FREE_DAMPING, delta);
      particle.vx *= damping;
      particle.vy *= damping;

      const r = particle.radius;

      if (particle.x - r <= 0) {
        particle.x = r;
        particle.vx = Math.abs(particle.vx) * BOUNCE;
      } else if (particle.x + r >= width) {
        particle.x = width - r;
        particle.vx = -Math.abs(particle.vx) * BOUNCE;
      }

      if (particle.y - r <= 0) {
        particle.y = r;
        particle.vy = Math.abs(particle.vy) * BOUNCE;
      } else if (particle.y + r >= height) {
        particle.y = height - r;
        particle.vy = -Math.abs(particle.vy) * BOUNCE;
      }

      particle.freeTime += delta;

      const speed = Math.hypot(particle.vx, particle.vy);
      if (
        particle.kind === "orbit" &&
        speed < MIN_FREE_SPEED &&
        particle.freeTime >= RETURN_DELAY
      ) {
        particle.state = "returning";
        particle.returnTime = 0;
      }
    }

    function updateBackgroundWander(particle, delta, width, height) {
      const factor = delta / 16.67;
      const targetVX =
        Math.sin(particle.orbitPhase + particle.x * 0.004) * 0.18;
      const targetVY =
        Math.cos(particle.orbitPhase + particle.y * 0.003) * 0.18;

      particle.vx += (targetVX - particle.vx) * 0.018 * factor;
      particle.vy += (targetVY - particle.vy) * 0.018 * factor;
      particle.x += particle.vx * factor;
      particle.y += particle.vy * factor;

      const r = particle.radius;
      if (particle.x < -r) particle.x = width + r;
      if (particle.x > width + r) particle.x = -r;
      if (particle.y < -r) particle.y = height + r;
      if (particle.y > height + r) particle.y = -r;
    }

    function returnToOrbit(particle, width, height, delta) {
      const limits = getOrbitLimits(width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      particle.orbitRadiusX = Math.min(particle.orbitRadiusX, limits.x);
      particle.orbitRadiusY = Math.min(particle.orbitRadiusY, limits.y);

      /*
       * A órbita continua avançando enquanto a partícula retorna.
       * Portanto o alvo se move durante todo o retorno e nunca existe
       * teletransporte para a antiga posição.
       */
      particle.orbitAngle += particle.orbitSpeed * delta;

      const targetX =
        centerX + Math.cos(particle.orbitAngle) * particle.orbitRadiusX;
      const targetY =
        centerY + Math.sin(particle.orbitAngle) * particle.orbitRadiusY;

      const dx = targetX - particle.x;
      const dy = targetY - particle.y;
      const distance = Math.hypot(dx, dy);
      const factor = delta / 16.67;

      particle.vx += dx * ORBIT_RECOVERY_FORCE * factor;
      particle.vy += dy * ORBIT_RECOVERY_FORCE * factor;
      particle.vx *= Math.pow(ORBIT_DAMPING, factor);
      particle.vy *= Math.pow(ORBIT_DAMPING, factor);

      particle.x += particle.vx * factor;
      particle.y += particle.vy * factor;
      particle.returnTime += delta;

      const speed = Math.hypot(particle.vx, particle.vy);

      if (distance < 5 && speed < 0.18) {
        particle.x += dx * 0.18;
        particle.y += dy * 0.18;
      }

      if (distance < 1.5 && speed < 0.075) {
        particle.x = targetX;
        particle.y = targetY;
        particle.vx = 0;
        particle.vy = 0;
        particle.state = "orbit";
        particle.freeTime = 0;
        particle.returnTime = 0;
      }
    }

    function releaseParticlePointer(particle) {
      if (pointerRef.current?.particle !== particle) return;

      const pointerId = pointerRef.current.pointerId;
      pointerRef.current = null;

      try {
        particle.element?.releasePointerCapture(pointerId);
      } catch {
        // A captura pode já ter sido liberada pelo navegador.
      }
    }

    function triggerColorTakeover(colorName) {
      const overlay = colorTakeoverRef.current;
      if (!overlay) return;

      const hex = COLOR_HEX[colorName] || COLOR_HEX.purple;

      overlay.style.background = hex;
      // Força o reflow pra garantir que a troca de cor não "pule" a
      // transição caso o fundo já estivesse ativo de uma explosão anterior.
      // eslint-disable-next-line no-unused-expressions
      overlay.offsetHeight;
      overlay.classList.add("is-active");

      window.setTimeout(() => {
        if (destroyed) return;
        overlay.classList.remove("is-active");
      }, MEGA_COLOR_HOLD_MS);
    }

    function explode(particle, isMega) {
      if (particle.state === "exploding") return;

      particle.state = "exploding";
      particle.dragging = false;
      particle.charging = false;
      particle.chargeStart = null;
      particle.popStart = performance.now();

      releaseParticlePointer(particle);

      // O raio que a partícula atingiu no momento de estourar — é a partir
      // dele que escalamos quantidade, velocidade e tamanho dos fragmentos,
      // então quanto maior ela cresceu, maior e mais violenta a explosão.
      const explosionRadius = particle.radius;

      const fragmentCount = clamp(
        Math.round(explosionRadius * FRAGMENTS_PER_RADIUS_PX),
        FRAGMENT_COUNT_MIN,
        isMega ? FRAGMENT_COUNT_MAX_MEGA : FRAGMENT_COUNT_MAX_NORMAL,
      );

      const speedMin = clamp(explosionRadius * 0.035, 2, 26);
      const speedMax = clamp(explosionRadius * 0.11, speedMin + 1.5, 42);

      const fragmentRadiusMin = clamp(explosionRadius * 0.014, 1, 3.2);
      const fragmentRadiusMax = clamp(
        explosionRadius * 0.036,
        fragmentRadiusMin + 0.6,
        6.5,
      );

      for (let i = 0; i < fragmentCount; i += 1) {
        const angle = random(0, Math.PI * 2);
        // Fragmentos com velocidades variadas dão uma explosão mais
        // orgânica do que todos saindo na mesma força.
        const speed = random(speedMin, speedMax);

        createParticle({
          kind: "fragment",
          x: particle.x,
          y: particle.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: random(fragmentRadiusMin, fragmentRadiusMax),
          color: randomFragmentColor(),
          life: random(850, 1700),
          alpha: random(0.75, 1),
        });
      }

      if (isMega) {
        triggerColorTakeover(particle.color);
      }

      particle.element?.classList.remove(
        "is-dragging",
        "is-charging",
        "is-mega",
      );
      particle.element?.classList.add("is-removing");

      window.setTimeout(() => {
        if (!destroyed) removeParticle(particle);
      }, POP_DURATION_MS + 40);
    }

    function updateCharge(particle, delta, width, height, time) {
      if (!particle.charging) {
        if (
          particle.chargeStart != null &&
          time - particle.chargeStart >= HOLD_TO_CHARGE_MS
        ) {
          particle.charging = true;
          particle.chargeElapsed = 0;
          // O sorteio de "mega" acontece exatamente no instante em que a
          // partícula começa a carregar — 25% de chance.
          particle.isMegaCandidate = Math.random() < MEGA_CHANCE;

          particle.element?.classList.add("is-charging");
          if (particle.isMegaCandidate) {
            particle.element?.classList.add("is-mega");
          }
        }
        return;
      }

      particle.chargeElapsed += delta;
      const secondsCharging = particle.chargeElapsed / 1000;

      let maxRadius;
      let growthRate;

      if (particle.isMegaCandidate) {
        maxRadius = Math.hypot(width, height) * MEGA_RADIUS_FACTOR;
        growthRate = MEGA_GROWTH_RATE;
      } else {
        maxRadius = CHARGE_EXPLODE_RADIUS;
        growthRate = CHARGE_GROWTH_RATE;
      }

      // Curva exponencial: cresce bem devagar nos primeiros segundos e
      // acelera bastante conforme o tempo de carregamento avança.
      const grownRadius =
        particle.baseRadius +
        growthRate * Math.pow(secondsCharging, CHARGE_GROWTH_EXP);

      particle.radius = Math.min(grownRadius, maxRadius);

      if (particle.element) {
        particle.element.style.width = `${particle.radius * 2}px`;
        particle.element.style.height = `${particle.radius * 2}px`;
      }

      if (particle.radius >= maxRadius) {
        explode(particle, particle.isMegaCandidate);
      }
    }

    function collide(a, b) {
      if (a.state === "removed" || b.state === "removed") return;
      if (a.kind === "fragment" || b.kind === "fragment") return;
      if (a.state === "orbit" || b.state === "orbit") return;
      if (a.dragging || b.dragging) return;
      if (a.state === "returning" || b.state === "returning") return;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distanceSq = dx * dx + dy * dy;
      const minDistance = a.radius + b.radius;

      if (distanceSq <= 0 || distanceSq >= minDistance * minDistance) return;

      const distance = Math.sqrt(distanceSq);
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      const totalMass = a.mass + b.mass;

      a.x -= nx * overlap * (b.mass / totalMass);
      a.y -= ny * overlap * (b.mass / totalMass);
      b.x += nx * overlap * (a.mass / totalMass);
      b.y += ny * overlap * (a.mass / totalMass);

      const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relativeVelocity > 0) return;

      const impulse =
        (-(1 + 0.92) * relativeVelocity) / (1 / a.mass + 1 / b.mass);
      const impulseX = impulse * nx;
      const impulseY = impulse * ny;

      a.vx -= impulseX / a.mass;
      a.vy -= impulseY / a.mass;
      b.vx += impulseX / b.mass;
      b.vy += impulseY / b.mass;
    }

    function render(particle, time) {
      if (!particle.element) return;

      if (particle.state === "exploding") {
        // O "pop" de explosão é calculado aqui, no JS, e não por uma
        // animação CSS de transform — assim ele fica combinado com o
        // translate3d da posição real, em vez de substituí-lo (o que
        // fazia a partícula "pular" pro canto da tela ao estourar).
        const elapsed = time - (particle.popStart ?? time);
        const t = clamp(elapsed / POP_DURATION_MS, 0, 1);

        const scale =
          t < 0.45
            ? 1 + (1.8 - 1) * (t / 0.45)
            : 1.8 + (0 - 1.8) * ((t - 0.45) / 0.55);

        const fade =
          t < 0.45
            ? 1 + (0.9 - 1) * (t / 0.45)
            : 0.9 + (0 - 0.9) * ((t - 0.45) / 0.55);

        particle.element.style.transform = `translate3d(${particle.x - particle.radius}px, ${particle.y - particle.radius}px, 0) scale(${scale})`;
        particle.element.style.opacity = String(clamp(fade, 0, 1));
        return;
      }

      const age = time - particle.born;
      const birth = Math.min(age / 700, 1);
      let opacity = particle.alpha * birth;

      if (particle.state !== "dragging" && age > particle.life - 1200) {
        opacity *= Math.max(0, (particle.life - age) / 1200);
      }

      if (particle.state === "dragging") {
        opacity = Math.min(1, opacity + 0.12);
      }

      particle.element.style.transform = `translate3d(${particle.x - particle.radius}px, ${particle.y - particle.radius}px, 0)`;
      particle.element.style.opacity = String(
        Math.max(0, Math.min(1, opacity)),
      );
    }

    function spawnParticle() {
      if (particlesRef.current.length >= MAX_PARTICLES) return;
      createParticle({ kind: "orbit" });
    }

    for (let i = 0; i < PARTICLE_TARGET; i += 1) {
      createParticle({
        kind: "orbit",
        orbitAngle: (Math.PI * 2 * i) / PARTICLE_TARGET + random(-0.08, 0.08),
      });
    }

    function animate(time) {
      if (destroyed) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = Math.min(32, Math.max(8, time - lastTimeRef.current));
      lastTimeRef.current = time;

      const { width, height } = getBounds();
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];

        if (particle.shrinking) {
          const diff = particle.baseRadius - particle.radius;
          particle.radius += diff * SHRINK_EASE;

          if (Math.abs(diff) < 0.4) {
            particle.radius = particle.baseRadius;
            particle.shrinking = false;
          }

          if (particle.element) {
            particle.element.style.width = `${particle.radius * 2}px`;
            particle.element.style.height = `${particle.radius * 2}px`;
          }
        }

        if (particle.state === "orbit") {
          updateOrbit(particle, delta, width, height);
        } else if (particle.state === "free") {
          if (particle.kind === "orbit" || particle.kind === "fragment") {
            updateFree(particle, delta, width, height);
          } else {
            updateBackgroundWander(particle, delta, width, height);
          }
        } else if (particle.state === "returning") {
          returnToOrbit(particle, width, height, delta);
        } else if (particle.state === "dragging") {
          updateCharge(particle, delta, width, height, time);
        }

        if (
          time - particle.born >= particle.life &&
          particle.state !== "dragging" &&
          particle.state !== "returning"
        ) {
          removeParticle(particle);
          continue;
        }

        render(particle, time);
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          collide(particles[i], particles[j]);
        }
      }

      spawnTimerRef.current += delta;
      if (spawnTimerRef.current >= spawnDelayRef.current) {
        spawnTimerRef.current = 0;
        spawnDelayRef.current = random(700, 1500);
        spawnParticle();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    function handleResize() {
      const { width, height } = getBounds();
      const limits = getOrbitLimits(width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      for (const particle of particlesRef.current) {
        particle.orbitRadiusX = Math.min(particle.orbitRadiusX, limits.x);
        particle.orbitRadiusY = Math.min(particle.orbitRadiusY, limits.y);

        if (particle.state === "orbit") {
          particle.x =
            centerX + Math.cos(particle.orbitAngle) * particle.orbitRadiusX;
          particle.y =
            centerY + Math.sin(particle.orbitAngle) * particle.orbitRadiusY;
        } else if (
          particle.state === "free" &&
          particle.kind === "background"
        ) {
          particle.x = Math.max(
            -particle.radius,
            Math.min(width + particle.radius, particle.x),
          );
          particle.y = Math.max(
            -particle.radius,
            Math.min(height + particle.radius, particle.y),
          );
        }
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      destroyed = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener("resize", handleResize);

      if (
        pointerRef.current?.particle?.element &&
        pointerRef.current.pointerId != null
      ) {
        try {
          pointerRef.current.particle.element.releasePointerCapture(
            pointerRef.current.pointerId,
          );
        } catch {
          // Nada a fazer se a captura já tiver sido liberada.
        }
      }

      particlesRef.current.forEach((particle) => particle.element?.remove());
      particlesRef.current = [];
      pointerRef.current = null;
      lastTimeRef.current = 0;
      spawnTimerRef.current = 0;
      spawnDelayRef.current = 1100;
    };
  }, []);

  return { particleLayerRef, colorTakeoverRef };
}
