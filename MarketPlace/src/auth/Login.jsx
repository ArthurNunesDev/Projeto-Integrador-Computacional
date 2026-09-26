import { useEffect, useMemo, useRef, useState } from "react";
import "./Login.css";
import "./Particulas.css";
import "./TelasLogin.css";
import Stikers from "../pets/Stickers";

/* 
   CAMPO DE PONTOS FLUTUANTES
   - Cada ponto mantém o movimento ambiente original.
   - Pode ser pego, arrastado e arremessado.
   - Não cresce nem explode.
   - Ao perder velocidade, retorna suavemente ao movimento original.
   */

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

function Login({ onLogin, onNavigate, onRegister, configuracoesLogin }) {
  const [modoCadastro, setModoCadastro] = useState(false);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarCadastroSenha, setMostrarCadastroSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");

  // Gerado uma única vez por montagem — cada carregamento da tela tem seu
  // próprio "mapa de estrelas" aleatório.
  const dotField = useMemo(() => createDotField(), []);

  function abrirCadastro() {
    setErro("");
    setErroCadastro("");
    setModoCadastro(true);
  }

  function voltarLogin() {
    setErro("");
    setErroCadastro("");
    setModoCadastro(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!usuario.trim() || !senha.trim()) {
      setErro("Preencha seu usuário e sua senha.");
      return;
    }

    if (onLogin) {
      onLogin({
        usuario: usuario.trim(),
        senha,
      });
    }
  }

  function handleCadastro(event) {
    event.preventDefault();
    setErroCadastro("");

    if (
      !nome.trim() ||
      !cadastroEmail.trim() ||
      !cadastroSenha ||
      !confirmarSenha
    ) {
      setErroCadastro("Preencha todos os campos.");
      return;
    }

    if (cadastroSenha.length < 6) {
      setErroCadastro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (cadastroSenha !== confirmarSenha) {
      setErroCadastro("As senhas não coincidem.");
      return;
    }

    if (onRegister) {
      onRegister({
        nome: nome.trim(),
        email: cadastroEmail.trim(),
        senha: cadastroSenha,
      });
    }
  }

  /* 
     PARTÍCULAS 
     - partículas próximas ao login orbitam normalmente
     - todas podem ser pegadas e arrastadas
     - ao soltar, são lançadas na direção do movimento
     - partículas de órbita retornam suavemente para a órbita móvel
     - partículas livres de fundo continuam vagando pela tela
     - clique curto nunca remove uma partícula
     */

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

  /* 
     SEGURAR PRA CARREGAR → EXPLODIR
     - segurar uma partícula por mais de 5s começa o "carregamento"
     - o raio cresce bem devagar no início e acelera com o tempo
     - ao atingir o raio de explosão, estoura em vários fragmentos
     - 25% de chance (sorteado ao começar a carregar) de virar uma
       "mega" partícula: cresce até cobrir a tela inteira, explode,
       e o fundo assume a cor dela por alguns segundos
      */

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
    if (configuracoesLogin?.particulas === false) return undefined;

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

  /* 
     CAMPO DE PONTOS — SISTEMA FÍSICO 
     - movimento de fundo contínuo, sem fade/desaparecimento
     - pegar / arrastar / arremessar
     - captura ilimitada de pontos
     - cadeia elástica com inércia
     - cada partícula capturada fica exatamente na ponta do seu segmento
     - corda desenhada por segmentos suaves que terminam nos centros reais
     - onda leve ao lançamento
     - memória de retorno para a posição original
      */

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

  /* 
     PARTÍCULAS SVG — INTERAÇÃO
     As partículas decorativas que já vagavam pela tela também
     podem ser pegadas. Depois do lançamento, continuam vagando
     aleatoriamente e não retornam para o login.
      */

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

  return (
    <main
      className={`login-page ${
        configuracoesLogin?.estilo === "neon" ? "login-estilo-neon" : ""
      } ${
        configuracoesLogin?.animacoes === false ? "login-sem-animacoes" : ""
      }`}
      data-particulas={
        configuracoesLogin?.particulas === false ? "false" : "true"
      }
      data-login-pet={configuracoesLogin?.pet || "glutao"}
    >
      {configuracoesLogin?.pet !== "nenhum" && <Stikers />}
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>

        <div className="login-svg-motion" aria-hidden="true">
          <svg className="motion-orbit motion-orbit-one" viewBox="0 0 900 700">
            <defs>
              <path
                id="login-motion-path-one"
                d="M90 350 C140 90 390 40 620 120 C850 200 850 500 610 590 C370 680 140 610 90 350Z"
              />
            </defs>

            <use href="#login-motion-path-one" className="motion-path" />

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="8"
                className="motion-dot motion-dot-purple"
              />
              <circle
                cx="0"
                cy="0"
                r="18"
                className="motion-halo motion-halo-purple"
              />
              <animateMotion
                dur="13s"
                begin="0s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-one" />
              </animateMotion>
            </g>

            <g className="motion-object">
              <path d="M0 -11 L8 0 L0 11 L-8 0 Z" className="motion-diamond" />
              <animateMotion
                dur="18s"
                begin="-5s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-one" />
              </animateMotion>
            </g>
          </svg>

          <svg className="motion-orbit motion-orbit-two" viewBox="0 0 900 700">
            <defs>
              <path
                id="login-motion-path-two"
                d="M130 520 C250 650 510 650 690 490 C830 365 790 150 620 95 C420 30 170 150 130 350 C115 420 115 470 130 520Z"
              />
            </defs>

            <use href="#login-motion-path-two" className="motion-path" />

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="6"
                className="motion-dot motion-dot-gold"
              />
              <circle
                cx="0"
                cy="0"
                r="14"
                className="motion-halo motion-halo-gold"
              />
              <animateMotion
                dur="16s"
                begin="-7s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-two" />
              </animateMotion>
            </g>

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="4"
                className="motion-dot motion-dot-white"
              />
              <animateMotion
                dur="10s"
                begin="-2s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-two" />
              </animateMotion>
            </g>
          </svg>

          <svg className="motion-particles" viewBox="0 0 1000 760">
            <g className="motion-particle particle-one">
              <circle cx="130" cy="150" r="3" />
              <circle cx="130" cy="150" r="12" className="particle-glow" />
            </g>

            <g className="motion-particle particle-two">
              <circle cx="820" cy="185" r="2.5" />
              <circle cx="820" cy="185" r="11" className="particle-glow" />
            </g>

            <g className="motion-particle particle-three">
              <circle cx="770" cy="590" r="3" />
              <circle cx="770" cy="590" r="13" className="particle-glow" />
            </g>

            <g className="motion-particle particle-four">
              <circle cx="190" cy="610" r="2" />
              <circle cx="190" cy="610" r="10" className="particle-glow" />
            </g>

            <g className="motion-particle particle-five">
              <circle cx="900" cy="410" r="2" />
              <circle cx="900" cy="410" r="9" className="particle-glow" />
            </g>

            <g className="motion-particle particle-six">
              <circle cx="90" cy="390" r="2.5" />
              <circle cx="90" cy="390" r="10" className="particle-glow" />
            </g>
          </svg>

          <svg className="motion-spark motion-spark-one" viewBox="0 0 100 100">
            <path d="M50 5 L57 43 L95 50 L57 57 L50 95 L43 57 L5 50 L43 43 Z" />
          </svg>

          <svg className="motion-spark motion-spark-two" viewBox="0 0 100 100">
            <path d="M50 8 L55 45 L92 50 L55 55 L50 92 L45 55 L8 50 L45 45 Z" />
          </svg>
        </div>

        <div className="dot-field" aria-label="Campo de pontos interativos">
          {dotField.map((dot) => (
            <span
              key={dot.id}
              className="dot-field-wrapper"
              data-dot-id={dot.id}
              style={{
                top: `${dot.top}%`,
                left: `${dot.left}%`,
                animationDuration: `${dot.flyDuration}s`,
                animationDelay: `${dot.flyDelay}s`,
              }}
            >
              <span
                className="dot-field-dot"
                style={{
                  background: dot.color,
                  transformOrigin: `${dot.originX}px ${dot.originY}px`,
                  animationDuration: `${dot.rotateDuration}s`,
                  animationDelay: `${dot.rotateDelay}s`,
                }}
              />
            </span>
          ))}
        </div>

        <div
          ref={particleLayerRef}
          className="interactive-particle-layer"
        ></div>

        {/* Fundo assume a cor da mega-partícula por alguns segundos
            após ela explodir cobrindo a tela inteira. */}
        <div
          ref={colorTakeoverRef}
          className="particle-color-takeover"
          aria-hidden="true"
        ></div>
      </div>

      <div className="login-ring">
        <i></i>
        <i></i>
        <i></i>

        <div className="login-form-container">
          <div
            className={`login-slider-track ${modoCadastro ? "login-slider-track-register" : ""}`}
          >
            {/*LOGIN*/}
            <section className="login-slide login-slide-login">
              <div className="login-brand">
                <div className="login-logo">M</div>

                <div className="login-brand-text">
                  <h1>
                    Market<span>Faesa</span>
                  </h1>
                  <p>MARKETPLACE UNIVERSITÁRIO</p>
                </div>
              </div>

              <div className="login-heading">
                <span>ACESSO À CONTA</span>
                <h2>Bem-vindo de volta</h2>
                <p>
                  Entre na sua conta para continuar explorando o MarketFaesa.
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="login-email">E-mail</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4 7l8 6 8-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      id="login-usuario"
                      type="text"
                      value={usuario}
                      onChange={(event) => setUsuario(event.target.value)}
                      placeholder="seu usuário"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="login-senha">Senha</label>
                    <button
                      type="button"
                      className="login-forgot-button"
                      onClick={() =>
                        onNavigate && onNavigate("recuperar-senha")
                      }
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>

                    <input
                      id="login-senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setMostrarSenha((estado) => !estado)}
                      aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {mostrarSenha ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M3 3l18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.6 10.6a2 2 0 002.8 2.8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.9 4.4A10.8 10.8 0 0112 4c5.2 0 8.5 4 9.5 6-.4.9-1.3 2.2-2.6 3.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.1 6.1C4.2 7.5 3 9.2 2.5 10c1 2 4.3 6 9.5 6 1.1 0 2.1-.2 3-.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {erro && <div className="login-error">{erro}</div>}

                <button type="submit" className="login-submit">
                  <span>Entrar</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <div className="login-register">
                <span>Ainda não possui uma conta?</span>
                <button type="button" onClick={abrirCadastro}>
                  Criar conta
                </button>
              </div>

              <div className="login-footer">
                <span>© MarketFaesa</span>
                <span>·</span>
                <span>Marketplace Universitário</span>
              </div>
            </section>

            {/* CADASTRO */}
            <section className="login-slide login-slide-register">
              <div className="login-brand">
                <div className="login-logo">M</div>

                <div className="login-brand-text">
                  <h1>
                    Market<span>Faesa</span>
                  </h1>
                  <p>MARKETPLACE UNIVERSITÁRIO</p>
                </div>
              </div>

              <div className="login-heading">
                <span>NOVA CONTA</span>
                <h2>Crie sua conta</h2>
                <p>Cadastre-se para começar a usar o MarketFaesa.</p>
              </div>

              <form
                className="login-form register-form"
                onSubmit={handleCadastro}
              >
                <div className="login-field">
                  <label htmlFor="cadastro-nome">Nome</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-nome"
                      type="text"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-email">E-mail</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4 7l8 6 8-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      id="cadastro-email"
                      type="email"
                      value={cadastroEmail}
                      onChange={(event) => setCadastroEmail(event.target.value)}
                      placeholder="seu.email@faesa.br"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-senha">Senha</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-senha"
                      type={mostrarCadastroSenha ? "text" : "password"}
                      value={cadastroSenha}
                      onChange={(event) => setCadastroSenha(event.target.value)}
                      placeholder="Crie uma senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setMostrarCadastroSenha((estado) => !estado)
                      }
                      aria-label={
                        mostrarCadastroSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-confirmar">Confirmar senha</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-confirmar"
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(event) =>
                        setConfirmarSenha(event.target.value)
                      }
                      placeholder="Repita sua senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setMostrarConfirmarSenha((estado) => !estado)
                      }
                      aria-label={
                        mostrarConfirmarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {erroCadastro && (
                  <div className="login-error">{erroCadastro}</div>
                )}

                <button type="submit" className="login-submit register-submit">
                  <span>Cadastrar</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <div className="login-register">
                <span>Já possui uma conta?</span>
                <button type="button" onClick={voltarLogin}>
                  Entrar
                </button>
              </div>

              <div className="login-footer">
                <span>© MarketFaesa</span>
                <span>·</span>
                <span>Marketplace Universitário</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
