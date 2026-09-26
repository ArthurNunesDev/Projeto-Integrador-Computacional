import { useEffect } from "react";

export default function useDotField(dotField) {
useEffect(() => {
  const field = document.querySelector(".dot-field");
  if (!field) return undefined;

  const wrappers = Array.from(field.querySelectorAll(".dot-field-wrapper"));
  if (!wrappers.length) return undefined;

  /* Física geral */
  const DOT_DAMPING = 0.986;
  const DOT_BOUNCE = 0.78;
  const DOT_MIN_SPEED = 0.06;
  const DOT_SETTLE_TIME = 850;
  const DOT_MAX_SPEED = 11.5;

  /* Interação */
  const DOT_CAPTURE_DISTANCE = 30;
  const DOT_WAVE_DISTANCE = 145;
  const DOT_WAVE_PUSH = 0.13;
  const DOT_WAVE_COOLDOWN = 180;
  const DOT_RIPPLE_COOLDOWN = 150;

  /* Memória */
  const DOT_MEMORY_FORCE = 0.025;
  const DOT_MEMORY_DAMPING = 0.9;
  const DOT_MEMORY_MAX_TIME = 2600;

  /* Corda */
  const ROPE_REST_LENGTH = 23;
  const ROPE_MIN_LENGTH = 18;
  const ROPE_MAX_LENGTH = 34;
  const ROPE_STIFFNESS = 0.105;
  const ROPE_DAMPING = 0.82;
  const ROPE_VELOCITY_FOLLOW = 0.035;
  const ROPE_MAX_SPEED = 15;
  const ROPE_CAPTURE_COOLDOWN = 35;
  const ROPE_MAX_SAG = 9;

  let destroyed = false;
  let animationFrame = null;
  let active = null;
  let lastTime = performance.now();
  let connectionSvg = null;

  connectionSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  connectionSvg.classList.add("dot-field-connections");
  connectionSvg.setAttribute("aria-hidden", "true");
  field.prepend(connectionSvg);

  const now = performance.now();

  const dots = wrappers.map((wrapper, index) => {
    const data = dotField[index];
    const dotElement = wrapper.querySelector(".dot-field-dot");
    const rect = wrapper.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    /* Fases próprias tornam o campo vivo, mas previsível e estável. */
    const seed = (data?.id || index * 7919).toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }

    return {
      wrapper,
      dotElement,
      color: data.color,
      originalTop: Number(data.top) || 50,
      originalLeft: Number(data.left) || 50,
      originalX: x,
      originalY: y,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      idlePhase: Math.abs(hash % 628) / 100,
      idleSpeed: 0.00035 + (Math.abs(hash) % 100) / 1000000,
      idleAmpX: 5 + (Math.abs(hash) % 13),
      idleAmpY: 4 + (Math.abs(hash >> 4) % 12),
      dragging: false,
      pointerId: null,
      moved: false,
      lastX: x,
      lastY: y,
      lastMoveTime: now,
      stoppedTime: 0,
      lastRipple: 0,
      lastWave: 0,
      lastCapture: 0,
      memoryActive: false,
      memoryTime: 0,
      captured: false,
      ropeVX: 0,
      ropeVY: 0,
      attached: [],
    };
  });

  const PET_RESPAWN_COLORS = [
    "#a78bfa",
    "#f0d36b",
    "#ffffff",
    "#3264ae",
    "#3765a0",
    "#2458b4",
  ];

  function respawnConsumedDot(event) {
    if (destroyed) return;

    const id = String(event?.detail?.id ?? "");
    if (!id) return;

    const dot = dots.find(
      (item) => String(item.wrapper.dataset.dotId) === id,
    );
    if (!dot) return;

    const { rect, width, height } = getBounds();
    const padding = 18;
    const nextX =
      rect.left + padding + Math.random() * Math.max(1, width - padding * 2);
    const nextY =
      rect.top + padding + Math.random() * Math.max(1, height - padding * 2);
    const nextColor =
      PET_RESPAWN_COLORS[
        Math.floor(Math.random() * PET_RESPAWN_COLORS.length)
      ];
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.12 + Math.random() * 0.12;

    dot.x = nextX;
    dot.y = nextY;
    dot.originalX = nextX;
    dot.originalY = nextY;
    dot.originalTop = ((nextY - rect.top) / height) * 100;
    dot.originalLeft = ((nextX - rect.left) / width) * 100;
    dot.vx = Math.cos(angle) * speed;
    dot.vy = Math.sin(angle) * speed;
    dot.ropeVX = 0;
    dot.ropeVY = 0;
    dot.stoppedTime = 0;
    dot.memoryActive = false;
    dot.memoryTime = 0;
    dot.captured = false;
    dot.dragging = false;
    dot.pointerId = null;
    dot.moved = false;
    dot.lastX = nextX;
    dot.lastY = nextY;
    dot.lastMoveTime = performance.now();
    dot.lastCapture = 0;
    dot.color = nextColor;

    dot.wrapper.classList.remove(
      "is-pet-being-eaten",
      "is-pet-eaten",
      "is-dot-dragging",
      "is-dot-launched",
      "is-dot-attached",
      "is-dot-memory",
    );
    dot.wrapper.style.left = `${nextX - rect.left - 2}px`;
    dot.wrapper.style.top = `${nextY - rect.top - 2}px`;
    dot.wrapper.style.transform = "none";
    dot.wrapper.style.animation = "none";
    dot.wrapper.style.pointerEvents = "";
    dot.dotElement.style.background = nextColor;
    dot.dotElement.classList.remove("is-pet-being-eaten", "is-pet-eaten");
    dot.dotElement.style.removeProperty("--pet-eat-dx");
    dot.dotElement.style.removeProperty("--pet-eat-dy");

    requestAnimationFrame(() => {
      if (!destroyed) {
        dot.wrapper.style.animation = "";
      }
    });
  }

  window.addEventListener("pet-consume-dot", respawnConsumedDot);

  function getBounds() {
    const rect = field.getBoundingClientRect();
    return {
      rect,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function setPixelPosition(dot, x, y) {
    const { rect } = getBounds();
    dot.x = x;
    dot.y = y;
    dot.wrapper.style.left = `${x - rect.left - 2}px`;
    dot.wrapper.style.top = `${y - rect.top - 2}px`;
    dot.wrapper.style.transform = "none";
  }

  function restoreDot(dot) {
    if (destroyed) return;
    dot.ropeVX = 0;
    dot.ropeVY = 0;
    dot.stoppedTime = 0;
    dot.memoryActive = false;
    dot.memoryTime = 0;
    dot.captured = false;
    if (Math.hypot(dot.vx, dot.vy) < 0.08) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.12;
      dot.vx = Math.cos(angle) * speed;
      dot.vy = Math.sin(angle) * speed;
    }
    dot.wrapper.classList.remove(
      "is-dot-dragging",
      "is-dot-launched",
      "is-dot-attached",
      "is-dot-memory",
    );
    dot.wrapper.style.animation = "none";
  }

  function getIdlePosition(dot, time, rect) {
    return { x: dot.x, y: dot.y };
  }

  function updateIdleDot(dot, time, rect) {
    if (dot.dragging || dot.captured || dot.memoryActive) return;

    const factor = 16.67 / 16.67;
    const speed = Math.hypot(dot.vx, dot.vy);

    if (speed < 0.08) {
      const angle = Math.random() * Math.PI * 2;
      const drift = 0.12 + Math.random() * 0.1;
      dot.vx += Math.cos(angle) * drift;
      dot.vy += Math.sin(angle) * drift;
    }

    const currentSpeed = Math.hypot(dot.vx, dot.vy);
    const targetMin = 0.1;
    const targetMax = 0.24;
    if (currentSpeed > targetMax) {
      const scale = targetMax / currentSpeed;
      dot.vx *= scale;
      dot.vy *= scale;
    } else if (currentSpeed < targetMin) {
      const angle = Math.atan2(dot.vy || 0.001, dot.vx || 0.001);
      dot.vx += Math.cos(angle) * 0.025;
      dot.vy += Math.sin(angle) * 0.025;
    }

    dot.x += dot.vx * factor;
    dot.y += dot.vy * factor;

    const minX = rect.left + 2;
    const maxX = rect.right - 2;
    const minY = rect.top + 2;
    const maxY = rect.bottom - 2;

    if (dot.x <= minX) {
      dot.x = minX;
      dot.vx = Math.abs(dot.vx);
    } else if (dot.x >= maxX) {
      dot.x = maxX;
      dot.vx = -Math.abs(dot.vx);
    }

    if (dot.y <= minY) {
      dot.y = minY;
      dot.vy = Math.abs(dot.vy);
    } else if (dot.y >= maxY) {
      dot.y = maxY;
      dot.vy = -Math.abs(dot.vy);
    }

    dot.wrapper.style.left = `${dot.x - rect.left - 2}px`;
    dot.wrapper.style.top = `${dot.y - rect.top - 2}px`;
    dot.wrapper.style.transform = "none";
    dot.wrapper.style.animation = "none";
  }

  function freezeDot(dot) {
    dot.wrapper.style.animation = "none";
    dot.wrapper.style.transform = "none";
  }

  function triggerDotRipple(dot, strength = 1) {
    const stamp = performance.now();
    if (stamp - dot.lastRipple < DOT_RIPPLE_COOLDOWN) return;
    dot.lastRipple = stamp;
    dot.dotElement?.classList.remove("is-dot-ripple");
    dot.dotElement?.style.setProperty(
      "--dot-ripple-strength",
      String(Math.min(1.2, strength)),
    );
    requestAnimationFrame(() => {
      if (destroyed || !dot.dotElement) return;
      dot.dotElement.classList.add("is-dot-ripple");
      window.setTimeout(() => {
        if (!destroyed) dot.dotElement?.classList.remove("is-dot-ripple");
      }, 280);
    });
  }

  function pushDotFromSource(other, source, strength) {
    const dx = other.x - source.x;
    const dy = other.y - source.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.5) return;
    const force = strength * (1 - Math.min(1, distance / DOT_WAVE_DISTANCE));
    other.vx += (dx / distance) * force;
    other.vy += (dy / distance) * force;
    other.stoppedTime = 0;
  }

  function launchWave(source, initialStrength = 1) {
    const stamp = performance.now();
    if (stamp - source.lastWave < DOT_WAVE_COOLDOWN) return;
    source.lastWave = stamp;

    dots
      .filter(
        (other) =>
          other !== source &&
          !other.dragging &&
          !other.captured &&
          !other.memoryActive,
      )
      .map((other) => ({
        dot: other,
        distance: Math.hypot(other.x - source.x, other.y - source.y),
      }))
      .filter(({ distance }) => distance <= DOT_WAVE_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
      .forEach(({ dot: other, distance }, index) => {
        const delay = index * 32;
        window.setTimeout(() => {
          if (destroyed || other.dragging || other.captured) return;
          const strength =
            initialStrength *
            (1 - Math.min(0.65, distance / DOT_WAVE_DISTANCE));
          triggerDotRipple(other, strength);
          pushDotFromSource(other, source, DOT_WAVE_PUSH * strength);
        }, delay);
      });
  }

  function getCapturedDots(source) {
    return source?.attached || [];
  }

  function captureNearbyDots(source, previousX, previousY) {
    const stamp = performance.now();
    if (
      !source.dragging ||
      stamp - source.lastCapture < ROPE_CAPTURE_COOLDOWN
    )
      return;

    const dx = source.x - previousX;
    const dy = source.y - previousY;
    const length = Math.hypot(dx, dy);
    const radius = DOT_CAPTURE_DISTANCE + Math.min(14, length * 0.2);

    let best = null;
    let bestDistance = Infinity;

    dots.forEach((other) => {
      if (
        other === source ||
        other.dragging ||
        other.captured ||
        other.memoryActive
      )
        return;

      let distance;
      if (length < 0.5) {
        distance = Math.hypot(other.x - source.x, other.y - source.y);
      } else {
        const t = Math.max(
          0,
          Math.min(
            1,
            ((other.x - previousX) * dx + (other.y - previousY) * dy) /
              (length * length),
          ),
        );
        const closestX = previousX + dx * t;
        const closestY = previousY + dy * t;
        distance = Math.hypot(other.x - closestX, other.y - closestY);
      }

      if (distance <= radius && distance < bestDistance) {
        best = other;
        bestDistance = distance;
      }
    });

    if (!best) return;

    source.lastCapture = stamp;
    best.captured = true;
    best.vx = 0;
    best.vy = 0;
    best.ropeVX = source.vx * 0.18;
    best.ropeVY = source.vy * 0.18;
    best.wrapper.style.animation = "none";
    best.wrapper.classList.add("is-dot-attached");
    source.attached.push(best);
    triggerDotRipple(best, 0.85);
  }

  /*
   * A cadeia é uma sequência física real.
   * Cada massa tem apenas UM vizinho anterior. Assim nenhum ponto fica
   * artificialmente no meio de uma conexão ou tentando perseguir vários
   * pontos ao mesmo tempo.
   */
  function updateRope(source, delta) {
    const chain = getCapturedDots(source);
    if (!chain.length) return;

    const factor = Math.min(2, Math.max(0.5, delta / 16.67));
    let anchorX = source.x;
    let anchorY = source.y;
    let anchorVX = source.vx;
    let anchorVY = source.vy;

    chain.forEach((dot, index) => {
      const dx = dot.x - anchorX;
      const dy = dot.y - anchorY;
      const distance = Math.hypot(dx, dy) || 0.001;

      /* A direção atual é preservada para a corda balançar naturalmente. */
      let nx = dx / distance;
      let ny = dy / distance;

      if (distance < 2) {
        const av = Math.hypot(anchorVX, anchorVY);
        if (av > 0.01) {
          nx = -anchorVX / av;
          ny = -anchorVY / av;
        } else {
          nx = 1;
          ny = 0;
        }
      }

      const rest = Math.max(
        ROPE_MIN_LENGTH,
        Math.min(
          ROPE_MAX_LENGTH,
          ROPE_REST_LENGTH + Math.min(5, index * 0.12),
        ),
      );

      const targetX = anchorX + nx * rest;
      const targetY = anchorY + ny * rest;
      const springX = targetX - dot.x;
      const springY = targetY - dot.y;

      dot.ropeVX += springX * ROPE_STIFFNESS * factor;
      dot.ropeVY += springY * ROPE_STIFFNESS * factor;

      /* Transferência suave de velocidade, sem teletransportar a massa. */
      dot.ropeVX += (anchorVX - dot.ropeVX) * ROPE_VELOCITY_FOLLOW * factor;
      dot.ropeVY += (anchorVY - dot.ropeVY) * ROPE_VELOCITY_FOLLOW * factor;

      const damping = Math.pow(ROPE_DAMPING, factor);
      dot.ropeVX *= damping;
      dot.ropeVY *= damping;

      const ropeSpeed = Math.hypot(dot.ropeVX, dot.ropeVY);
      if (ropeSpeed > ROPE_MAX_SPEED) {
        const scale = ROPE_MAX_SPEED / ropeSpeed;
        dot.ropeVX *= scale;
        dot.ropeVY *= scale;
      }

      dot.x += dot.ropeVX * factor;
      dot.y += dot.ropeVY * factor;

      /* A restrição de distância impede a corda de esticar infinitamente. */
      const afterDX = dot.x - anchorX;
      const afterDY = dot.y - anchorY;
      const afterDistance = Math.hypot(afterDX, afterDY) || 0.001;
      const maxLength = rest + 7;

      if (afterDistance > maxLength) {
        const correction = afterDistance - maxLength;
        dot.x -= (afterDX / afterDistance) * correction * 0.92;
        dot.y -= (afterDY / afterDistance) * correction * 0.92;
        dot.ropeVX *= 0.88;
        dot.ropeVY *= 0.88;
      }

      setPixelPosition(dot, dot.x, dot.y);
      dot.wrapper.classList.add("is-dot-attached");

      anchorX = dot.x;
      anchorY = dot.y;
      anchorVX = dot.ropeVX;
      anchorVY = dot.ropeVY;
    });
  }

  function releaseAttachedDots(source) {
    const chain = getCapturedDots(source).slice();
    source.attached.length = 0;

    chain.forEach((dot, index) => {
      dot.captured = false;
      dot.wrapper.classList.remove("is-dot-attached");
      dot.wrapper.classList.add("is-dot-launched");

      const tailFactor = 1 - index / Math.max(1, chain.length);
      dot.vx = source.vx * (0.62 + tailFactor * 0.2) + dot.ropeVX * 0.6;
      dot.vy = source.vy * (0.62 + tailFactor * 0.2) + dot.ropeVY * 0.6;

      const speed = Math.hypot(dot.vx, dot.vy);
      if (speed > DOT_MAX_SPEED) {
        const scale = DOT_MAX_SPEED / speed;
        dot.vx *= scale;
        dot.vy *= scale;
      }

      dot.ropeVX = 0;
      dot.ropeVY = 0;
      dot.stoppedTime = 0;

      window.setTimeout(() => {
        if (!destroyed) dot.wrapper.classList.remove("is-dot-launched");
      }, 360);

      triggerDotRipple(dot, 0.65);
    });
  }

  function renderConnections() {
    if (!connectionSvg || !active?.dragging) {
      connectionSvg?.classList.remove("is-active");
      if (connectionSvg) connectionSvg.innerHTML = "";
      return;
    }

    const { rect } = getBounds();
    const chain = getCapturedDots(active);
    connectionSvg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    connectionSvg.style.color = active.color;
    connectionSvg.innerHTML = "";

    if (!chain.length) {
      connectionSvg.classList.add("is-active");
      return;
    }

    /*
     * Um path independente para cada trecho.
     * Cada trecho começa no centro de uma partícula e termina no centro
     * da seguinte. Portanto a partícula nunca aparece no meio da corda.
     */
    let fromX = active.x - rect.left;
    let fromY = active.y - rect.top;
    let fromVX = active.vx;
    let fromVY = active.vy;

    chain.forEach((dot, index) => {
      const toX = dot.x - rect.left;
      const toY = dot.y - rect.top;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / length;
      const ny = dx / length;

      /*
       * A curvatura depende da velocidade relativa dos dois extremos.
       * Ela é pequena e limitada para nunca produzir deformações enormes.
       */
      const relativeVX = dot.ropeVX - fromVX;
      const relativeVY = dot.ropeVY - fromVY;
      const bend = Math.max(
        -ROPE_MAX_SAG,
        Math.min(ROPE_MAX_SAG, (relativeVX * nx + relativeVY * ny) * 0.55),
      );
      const sag = bend + Math.sin(performance.now() * 0.004 + index) * 0.8;
      const controlX = (fromX + toX) / 2 + nx * sag;
      const controlY = (fromY + toY) / 2 + ny * sag;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${toX.toFixed(2)} ${toY.toFixed(2)}`,
      );
      path.classList.add("dot-field-connection-line", "is-rope");
      path.style.opacity = String(Math.max(0.55, 0.88 - index * 0.006));
      path.style.strokeWidth = String(Math.max(0.9, 1.35 - index * 0.004));
      connectionSvg.appendChild(path);

      fromX = toX;
      fromY = toY;
      fromVX = dot.ropeVX;
      fromVY = dot.ropeVY;
    });

    connectionSvg.classList.add("is-active");
  }

  function begin(event, dot) {
    if (destroyed || active || dot.captured) return;
    event.preventDefault();
    event.stopPropagation();

    freezeDot(dot);

    dot.dragging = true;
    dot.pointerId = event.pointerId;
    dot.moved = false;
    dot.vx = 0;
    dot.vy = 0;
    dot.lastX = event.clientX;
    dot.lastY = event.clientY;
    dot.lastMoveTime = performance.now();
    dot.lastCapture = 0;
    dot.stoppedTime = 0;
    dot.memoryActive = false;
    dot.memoryTime = 0;
    active = dot;

    dot.wrapper.classList.add("is-dot-dragging");
    renderConnections();

    try {
      dot.wrapper.setPointerCapture(event.pointerId);
    } catch {}
  }

  function move(event, dot) {
    if (destroyed || active !== dot || dot.pointerId !== event.pointerId)
      return;

    const stamp = performance.now();
    const dt = Math.max(8, Math.min(45, stamp - dot.lastMoveTime));
    const previousX = dot.x;
    const previousY = dot.y;
    const dx = event.clientX - dot.lastX;
    const dy = event.clientY - dot.lastY;

    if (Math.hypot(event.clientX - dot.x, event.clientY - dot.y) > 2) {
      dot.moved = true;
    }

    dot.vx = (dx / dt) * 16.67;
    dot.vy = (dy / dt) * 16.67;
    dot.x = event.clientX;
    dot.y = event.clientY;
    dot.lastX = event.clientX;
    dot.lastY = event.clientY;
    dot.lastMoveTime = stamp;

    const speed = Math.hypot(dot.vx, dot.vy);
    if (speed > DOT_MAX_SPEED) {
      const scale = DOT_MAX_SPEED / speed;
      dot.vx *= scale;
      dot.vy *= scale;
    }

    setPixelPosition(dot, dot.x, dot.y);
    captureNearbyDots(dot, previousX, previousY);
    updateRope(dot, dt);
    renderConnections();
  }

  function release(event, dot) {
    if (destroyed || active !== dot || dot.pointerId !== event.pointerId)
      return;

    const stamp = performance.now();
    const dt = Math.max(8, Math.min(45, stamp - dot.lastMoveTime));
    const releaseVX = ((event.clientX - dot.lastX) / dt) * 16.67;
    const releaseVY = ((event.clientY - dot.lastY) / dt) * 16.67;

    if (Math.abs(releaseVX) > 0.01 || Math.abs(releaseVY) > 0.01) {
      dot.vx = releaseVX;
      dot.vy = releaseVY;
    }

    const speed = Math.hypot(dot.vx, dot.vy);
    if (speed > DOT_MAX_SPEED) {
      const scale = DOT_MAX_SPEED / speed;
      dot.vx *= scale;
      dot.vy *= scale;
    }

    if (!dot.moved) {
      const chain = getCapturedDots(dot);
      chain.forEach((item) => {
        item.captured = false;
        item.wrapper.classList.remove("is-dot-attached");
        item.ropeVX = 0;
        item.ropeVY = 0;
      });
      dot.attached.length = 0;
      dot.wrapper.classList.remove("is-dot-dragging");
    } else {
      dot.wrapper.classList.remove("is-dot-dragging");
      dot.wrapper.classList.add("is-dot-launched");
      releaseAttachedDots(dot);
      launchWave(dot, Math.min(1, Math.max(0.35, speed / 7)));

      window.setTimeout(() => {
        if (!destroyed) dot.wrapper.classList.remove("is-dot-launched");
      }, 400);
    }

    dot.dragging = false;
    dot.pointerId = null;
    dot.memoryActive = false;
    dot.memoryTime = 0;
    if (Math.hypot(dot.vx, dot.vy) < 0.08) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.1;
      dot.vx = Math.cos(angle) * speed;
      dot.vy = Math.sin(angle) * speed;
    }
    active = null;
    renderConnections();

    try {
      dot.wrapper.releasePointerCapture(event.pointerId);
    } catch {}
  }

  dots.forEach((dot) => {
    dot.wrapper.style.cursor = "grab";
    dot.wrapper.style.pointerEvents = "auto";
    dot.wrapper.style.animation = "none";
    dot.onPointerDown = (event) => begin(event, dot);
    dot.onPointerMove = (event) => move(event, dot);
    dot.onPointerUp = (event) => release(event, dot);
    dot.onPointerCancel = (event) => release(event, dot);
    dot.wrapper.addEventListener("pointerdown", dot.onPointerDown);
    dot.wrapper.addEventListener("pointermove", dot.onPointerMove);
    dot.wrapper.addEventListener("pointerup", dot.onPointerUp);
    dot.wrapper.addEventListener("pointercancel", dot.onPointerCancel);
  });

  function updateMemory(dot, delta) {
    if (!dot.memoryActive) return;

    dot.memoryTime += delta;
    const factor = Math.min(2, Math.max(0.5, delta / 16.67));
    const { rect } = getBounds();
    const target = getIdlePosition(dot, performance.now(), rect);
    const dx = target.x - dot.x;
    const dy = target.y - dot.y;
    const distance = Math.hypot(dx, dy);

    dot.vx += dx * DOT_MEMORY_FORCE * factor;
    dot.vy += dy * DOT_MEMORY_FORCE * factor;
    dot.vx *= Math.pow(DOT_MEMORY_DAMPING, factor);
    dot.vy *= Math.pow(DOT_MEMORY_DAMPING, factor);
    dot.x += dot.vx * factor;
    dot.y += dot.vy * factor;

    dot.wrapper.classList.add("is-dot-memory");
    setPixelPosition(dot, dot.x, dot.y);

    if (distance < 5 || dot.memoryTime >= DOT_MEMORY_MAX_TIME) {
      dot.memoryActive = false;
      dot.memoryTime = 0;
      dot.vx = 0;
      dot.vy = 0;
      dot.wrapper.classList.remove("is-dot-memory");
      triggerDotRipple(dot, 0.5);
    }
  }

  function animate(time) {
    if (destroyed) return;

    const delta = Math.min(32, Math.max(8, time - lastTime));
    lastTime = time;
    const factor = delta / 16.67;
    const { rect } = getBounds();

    dots.forEach((dot) => {
      if (dot.dragging) return;

      if (dot.captured) {
        return;
      }

      if (dot.memoryActive) {
        dot.memoryActive = false;
        dot.memoryTime = 0;
        dot.wrapper.classList.remove("is-dot-memory");
      }

      const speed = Math.hypot(dot.vx, dot.vy);

      if (speed > DOT_MIN_SPEED) {
        dot.x += dot.vx * factor;
        dot.y += dot.vy * factor;
        dot.vx *= Math.pow(DOT_DAMPING, factor);
        dot.vy *= Math.pow(DOT_DAMPING, factor);

        const minX = rect.left + 2;
        const maxX = rect.right - 2;
        const minY = rect.top + 2;
        const maxY = rect.bottom - 2;

        if (dot.x <= minX) {
          dot.x = minX;
          dot.vx = Math.abs(dot.vx) * DOT_BOUNCE;
          triggerDotRipple(dot, 0.45);
        } else if (dot.x >= maxX) {
          dot.x = maxX;
          dot.vx = -Math.abs(dot.vx) * DOT_BOUNCE;
          triggerDotRipple(dot, 0.45);
        }

        if (dot.y <= minY) {
          dot.y = minY;
          dot.vy = Math.abs(dot.vy) * DOT_BOUNCE;
          triggerDotRipple(dot, 0.45);
        } else if (dot.y >= maxY) {
          dot.y = maxY;
          dot.vy = -Math.abs(dot.vy) * DOT_BOUNCE;
          triggerDotRipple(dot, 0.45);
        }

        dot.stoppedTime = 0;
        setPixelPosition(dot, dot.x, dot.y);
      } else {
        dot.stoppedTime = 0;
        updateIdleDot(dot, time, rect);
      }
    });

    if (active?.dragging) {
      updateRope(active, delta);
      renderConnections();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  animationFrame = requestAnimationFrame(animate);

  function handleResize() {
    if (active?.dragging) {
      renderConnections();
      return;
    }
    dots.forEach((dot) => {
      if (
        !dot.captured &&
        !dot.memoryActive &&
        !dot.dragging &&
        Math.hypot(dot.vx, dot.vy) <= DOT_MIN_SPEED
      ) {
        dot.wrapper.style.animation = "none";
      }
    });
  }

  window.addEventListener("resize", handleResize);

  return () => {
    destroyed = true;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pet-consume-dot", respawnConsumedDot);
    connectionSvg?.remove();

    dots.forEach((dot) => {
      dot.wrapper.removeEventListener("pointerdown", dot.onPointerDown);
      dot.wrapper.removeEventListener("pointermove", dot.onPointerMove);
      dot.wrapper.removeEventListener("pointerup", dot.onPointerUp);
      dot.wrapper.removeEventListener("pointercancel", dot.onPointerCancel);
      dot.wrapper.style.pointerEvents = "";
      dot.wrapper.style.animation = "";
      dot.wrapper.style.left = `${dot.originalLeft}%`;
      dot.wrapper.style.top = `${dot.originalTop}%`;
      dot.wrapper.style.transform = "";
      dot.wrapper.classList.remove(
        "is-dot-dragging",
        "is-dot-launched",
        "is-dot-attached",
        "is-dot-memory",
      );
      dot.dotElement?.classList.remove("is-dot-ripple");
    });
    active = null;
  };
}, [dotField]);

}
