import { useEffect, useRef } from "react";
import "./Glutao.css";

/* =========================================================
   AUFA / MARKETFAESA — GLUTÃO (CARCAJU)
   Mascote autônomo que caminha pela tela e reage ao cursor.

   A locomoção é escrita em "heading + speed" (direção e
   velocidade escalar) em vez de vetor livre. É isso que dá o
   caminhar curvo e natural: o bicho gira até no máximo uma
   certa taxa por segundo e desacelera quando a curva é
   fechada, exatamente como um animal de verdade.

   A animação das patas é dirigida por DISTÂNCIA PERCORRIDA,
   não por tempo. Assim a passada nunca "patina": em qualquer
   velocidade os pés acompanham o chão.
   ========================================================= */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

/* Menor diferença angular entre dois ângulos (-PI..PI). */
const angleDelta = (from, to) => {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

/* Tamanho do mascote em pixels de tela. */
const PET_W = 104;
const PET_H = 75;

/* Comprimento de uma passada completa, em pixels percorridos. */
const STRIDE = 30;

/* Raio de clique no mascote. */
const HIT_RADIUS = 58;

function Pet() {
  const petRef = useRef(null);
  const layerRef = useRef(null);

  const S = useRef({
    /* posição e locomoção */
    x: 0,
    y: 0,
    heading: 0,
    speed: 0,
    targetX: 0,
    targetY: 0,
    cruise: 70,

    /* cursor */
    mouseX: -99999,
    mouseY: -99999,
    mouseVX: 0,
    mouseVY: 0,
    mouseStamp: 0,
    mouseSeen: false,

    /* estado */
    mode: "walk",
    modeUntil: 0,
    nextTargetAt: 0,
    nextAffectionAt: 0,
    nextBlinkAt: 0,
    blinkUntil: 0,
    nextIdleAt: 0,

    /* rig visual */
    facing: 1,
    facingSmooth: 1,
    stride: 0,
    visualSpeed: 0,
    headTurn: 0,
    earTwitch: 0,

    /* arrastar */
    heldOffsetX: 0,
    heldOffsetY: 0,

    /* roubar o cursor */
    carryUntil: 0,
    carryActive: false,
    carryStartedAt: 0,
    stalkStartedAt: 0,
    nextStealAt: 0,
    nextCuriousAt: 0,

    /* comer um ponto do campo */
    eatUntil: 0,
    eatDot: null,
    eatColor: "",
    eatHue: 30,
    nextEatAt: 0,

    lastTime: 0,
    ready: false,
  }).current;

  useEffect(() => {
    const pet = petRef.current;
    const layer = layerRef.current;
    if (!pet || !layer) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* Cache do dataset: escrever no DOM só quando muda de verdade,
       em vez de todo frame, evita recalculo de estilo desnecessário. */
    const shown = {
      mode: "",
      walking: "",
      blink: "",
      facing: "",
      eating: "",
    };

    const setData = (key, value) => {
      if (shown[key] === value) return;
      shown[key] = value;
      pet.dataset[key] = value;
    };

    /* ----------------------------------------------------------
       COMER UM PONTO
       O Pet lê somente os pontos visuais já existentes no campo.
       A física do Login não é alterada: o ponto apenas fica
       temporariamente invisível e volta exatamente ao campo depois.
       ---------------------------------------------------------- */
    const hexToHsl = (value) => {
      if (!value) return { h: 30, s: 70, l: 60 };

      let hex = String(value).trim();

      if (hex.startsWith("#")) {
        if (hex.length === 4) {
          hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        if (hex.length === 7) {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const d = max - min;
          const l = (max + min) / 2;

          if (d === 0) return { h: 30, s: 0, l: l * 100 };

          const s = d / (1 - Math.abs(2 * l - 1));
          let h = 0;

          if (max === r) h = 60 * (((g - b) / d) % 6);
          else if (max === g) h = 60 * ((b - r) / d + 2);
          else h = 60 * ((r - g) / d + 4);

          if (h < 0) h += 360;

          return {
            h,
            s: s * 100,
            l: l * 100,
          };
        }
      }

      const match = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);

      if (match) {
        const r = Number(match[1]) / 255;
        const g = Number(match[2]) / 255;
        const b = Number(match[3]) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        const l = (max + min) / 2;

        if (d === 0) return { h: 30, s: 0, l: l * 100 };

        const s = d / (1 - Math.abs(2 * l - 1));
        let h = 0;

        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);

        if (h < 0) h += 360;

        return { h, s: s * 100, l: l * 100 };
      }

      return { h: 30, s: 70, l: 60 };
    };

    const getDotColor = (dotElement) => {
      if (!dotElement) return "#a78bfa";
      return (
        dotElement.style.background ||
        window.getComputedStyle(dotElement).backgroundColor ||
        "#a78bfa"
      );
    };

    const restoreEatenDot = () => {
      const dot = S.eatDot;
      if (!dot) return;

      const wrapper = dot.closest(".dot-field-wrapper");
      wrapper?.classList.remove("is-pet-being-eaten", "is-pet-eaten");

      dot.classList.remove("is-pet-being-eaten", "is-pet-eaten");
      dot.style.removeProperty("--pet-eat-dx");
      dot.style.removeProperty("--pet-eat-dy");

      S.eatDot = null;
    };

    const startEating = (dotElement, now) => {
      if (
        !dotElement ||
        S.eatDot ||
        now < S.nextEatAt ||
        S.carryActive ||
        S.mode !== "walk"
      ) {
        return false;
      }

      const wrapper = dotElement.closest(".dot-field-wrapper");
      if (!wrapper) return false;

      if (
        wrapper.classList.contains("is-dot-dragging") ||
        wrapper.classList.contains("is-dot-attached") ||
        wrapper.classList.contains("is-dot-memory") ||
        wrapper.classList.contains("is-pet-eaten") ||
        wrapper.classList.contains("is-pet-being-eaten")
      ) {
        return false;
      }

      const rect = dotElement.getBoundingClientRect();
      const dotX = rect.left + rect.width / 2;
      const dotY = rect.top + rect.height / 2;
      const mouthX = S.x + S.facing * 49;
      const mouthY = S.y + 2;

      const color = getDotColor(dotElement);
      const hsl = hexToHsl(color);

      S.eatDot = dotElement;
      S.eatHue = hsl.h;
      S.eatColor = color;
      S.eatUntil = now + 10000;
      S.nextEatAt = now + 30000;

      dotElement.style.setProperty("--pet-eat-dx", `${mouthX - dotX}px`);
      dotElement.style.setProperty("--pet-eat-dy", `${mouthY - dotY}px`);

      wrapper.classList.add("is-pet-being-eaten");
      dotElement.classList.add("is-pet-being-eaten");

      window.setTimeout(() => {
        if (!S.eatDot || S.eatDot !== dotElement) return;
        wrapper.classList.remove("is-pet-being-eaten");
        wrapper.classList.add("is-pet-eaten");
        dotElement.classList.remove("is-pet-being-eaten");
        dotElement.classList.add("is-pet-eaten");
      }, 430);

      S.speed = 0;
      S.heading = Math.atan2(dotY - S.y, dotX - S.x);
      setMode("eat", now + 720);

      return true;
    };

    const tryEatNearbyDot = (now) => {
      if (
        reduced ||
        S.mode !== "walk" ||
        S.speed < 14 ||
        S.eatDot ||
        now < S.nextEatAt ||
        typingNow()
      ) {
        return;
      }

      const field = document.querySelector(".dot-field");
      if (!field) return;

      const candidates = field.querySelectorAll(".dot-field-dot");
      let closest = null;
      let closestDistance = 52;

      for (const dot of candidates) {
        const wrapper = dot.closest(".dot-field-wrapper");
        if (!wrapper) continue;

        if (
          wrapper.classList.contains("is-dot-dragging") ||
          wrapper.classList.contains("is-dot-attached") ||
          wrapper.classList.contains("is-dot-memory") ||
          wrapper.classList.contains("is-pet-eaten") ||
          wrapper.classList.contains("is-pet-being-eaten")
        ) {
          continue;
        }

        const rect = dot.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - S.x;
        const dy = rect.top + rect.height / 2 - S.y;
        const distance = Math.hypot(dx, dy);

        if (distance < closestDistance) {
          closestDistance = distance;
          closest = dot;
        }
      }

      if (closest) startEating(closest, now);
    };

    /* ----------------------------------------------------------
       LIMITES DA TELA
       Um único lugar define a área caminhável. Antes o sorteio de
       destino e o clamp usavam contas diferentes, então o mascote
       escolhia alvos fora da área e ficava tremendo na borda.
       ---------------------------------------------------------- */
    const bounds = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mx = clamp(w * 0.07, 40, 110);
      const my = clamp(h * 0.1, 56, 120);
      return {
        w,
        h,
        left: mx,
        right: Math.max(mx + 1, w - mx),
        top: my,
        bottom: Math.max(my + 1, h - my * 0.6),
      };
    };

    const setMode = (mode, until = 0) => {
      S.mode = mode;
      S.modeUntil = until;
    };

    /* Sorteia um destino dentro da área, longe o bastante do ponto
       atual para que valha a pena caminhar até lá. */
    const pickTarget = (now, minDistance = 200) => {
      const b = bounds();
      const reach = Math.min(b.right - b.left, b.bottom - b.top);
      const want = Math.min(minDistance, reach * 0.55);

      let tx = S.x;
      let ty = S.y;

      for (let i = 0; i < 12; i += 1) {
        tx = b.left + Math.random() * (b.right - b.left);
        ty = b.top + Math.random() * (b.bottom - b.top);
        if (Math.hypot(tx - S.x, ty - S.y) >= want) break;
      }

      S.targetX = tx;
      S.targetY = ty;
      S.nextTargetAt = now + 9000 + Math.random() * 7000;

      /* Cada trecho tem um ritmo próprio: às vezes ele passeia,
         às vezes atravessa a tela em meio trote. */
      const roll = Math.random();
      S.cruise = reduced ? 34 : roll < 0.55 ? 52 : roll < 0.9 ? 82 : 118;
    };

    const scheduleBlink = (now) => {
      S.nextBlinkAt = now + 2200 + Math.random() * 4800;
    };

    const scheduleAffection = (now) => {
      S.nextAffectionAt = now + 34000 + Math.random() * 40000;
    };

    /* O bote espontâneo é raro de propósito: a graça está em ser
       inesperado, e a página é uma tela de login. */
    const scheduleSteal = (now) => {
      S.nextStealAt = now + 210000 + Math.random() * 300000;
    };

    /* "Curioso" também precisa ser raro. Sem esse resfriado, o
       bicho reentrava no modo assim que o anterior expirava — desde
       que o mouse continuasse por perto e parado — e ficava
       acompanhando o cursor por tempo indefinido. */
    const scheduleCurious = (now) => {
      S.nextCuriousAt = now + 22000 + Math.random() * 40000;
    };

    /* ----------------------------------------------------------
       CURSOR ROUBADO
       Quando o mascote pega o cursor, a página fica completamente
       travada para interação. O usuário não consegue clicar,
       digitar, rolar, selecionar ou executar ações até o mascote
       soltar o cursor naturalmente pelo próprio tempo da brincadeira.
       ---------------------------------------------------------- */
    const setCarry = (active) => {
      S.carryActive = active;
      layer.dataset.carry = active ? "true" : "false";
      if (active) document.body.dataset.petCarry = "true";
      else delete document.body.dataset.petCarry;
    };

    const endCarry = (now) => {
      if (!S.carryActive) return;
      S.carryUntil = 0;
      S.carryStartedAt = 0;
      setCarry(false);

      /* O ponteiro ficou parado durante a brincadeira. Zerar a
         velocidade evita que o mascote leve um susto fantasma no
         primeiro frame depois de soltar. */
      S.mouseVX = 0;
      S.mouseVY = 0;
      S.mouseStamp = 0;
      scheduleSteal(now);
      setMode("walk");
      S.speed = Math.min(S.speed, 60);
      pickTarget(now, 160);
    };

    const typingNow = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable === true
      );
    };

    const startCarry = (now) => {
      if (reduced || typingNow()) return;

      const b = bounds();
      let tx = S.x;
      let ty = S.y;

      for (let i = 0; i < 12; i += 1) {
        tx = b.left + Math.random() * (b.right - b.left);
        ty = b.top + Math.random() * (b.bottom - b.top);
        if (Math.hypot(tx - S.x, ty - S.y) > 240) break;
      }

      S.targetX = tx;
      S.targetY = ty;
      S.cruise = 150;

      const trip = Math.hypot(tx - S.x, ty - S.y);
      S.carryUntil = now + clamp((trip / 150) * 1000 + 500, 1300, 3200);

      setCarry(true);
      S.carryStartedAt = now;
      setMode("bite", now + 320);
    };

    /* ----------------------------------------------------------
       EVENTOS
       ---------------------------------------------------------- */
    const onPointerMove = (event) => {
      /* Enquanto o mascote está com o cursor na boca, o movimento
         físico do mouse é ignorado por completo: o ponteiro real
         está invisível e quem manda na posição é o focinho. */
      if (S.carryActive) return;

      const now = performance.now();

      /* A velocidade do mouse é medida com o timestamp do próprio
         evento. Antes usava o tempo do último frame de animação, o
         que dava valores absurdos quando dois movimentos caíam no
         mesmo frame — e fazia o susto disparar do nada. */
      const dt = S.mouseStamp
        ? clamp((now - S.mouseStamp) / 1000, 0.004, 0.1)
        : 0.016;

      const nx = event.clientX;
      const ny = event.clientY;

      if (S.mouseSeen) {
        S.mouseVX = lerp(S.mouseVX, (nx - S.mouseX) / dt, 0.45);
        S.mouseVY = lerp(S.mouseVY, (ny - S.mouseY) / dt, 0.45);
      }

      S.mouseX = nx;
      S.mouseY = ny;
      S.mouseStamp = now;
      S.mouseSeen = true;
    };

    const onPointerDown = (event) => {
      const now = performance.now();

      /* Enquanto o mascote estiver segurando o cursor, qualquer
         tentativa de clique é totalmente bloqueada. O usuário só
         recupera a interação quando o próprio mascote terminar. */
      if (S.carryActive) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const dist = Math.hypot(event.clientX - S.x, event.clientY - S.y);
      if (dist > HIT_RADIUS) return;

      /* Se o mascote estiver passando por cima de um campo, botão ou
         link, o clique pertence à página, não a ele. Sem isso o bicho
         roubaria cliques do formulário de login sempre que cruzasse
         na frente dele. */
      if (event.target && event.target.closest) {
        if (
          event.target.closest(
            "input, textarea, select, button, a, label, [role='button'], [contenteditable='true']",
          )
        ) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();

      if (S.mode === "askPet") {
        setMode("petted", now + 1400);
        S.speed = 0;
        scheduleAffection(now);
        return;
      }

      /* Clique rápido rouba o cursor, clique mantido arrasta o bicho.
         O modo "held" começa agora; se soltar cedo, vira brincadeira. */
      S.heldOffsetX = S.x - event.clientX;
      S.heldOffsetY = S.y - event.clientY;
      S.speed = 0;
      setMode("held", now + 20000);
    };

    const onPointerUp = (event) => {
      const now = performance.now();

      if (S.carryActive) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (S.mode !== "held") return;

      const dist = Math.hypot(event.clientX - S.x, event.clientY - S.y);

      /* Soltou em cima dele e mal arrastou: ele retribui roubando
         o cursor e saindo correndo. */
      if (now < S.modeUntil - 19600 && dist < HIT_RADIUS) {
        startCarry(now);
        return;
      }

      setMode("walk");
      S.heading = Math.atan2(S.mouseVY, S.mouseVX) || S.heading;
      S.speed = clamp(Math.hypot(S.mouseVX, S.mouseVY) * 0.25, 0, 220);
      pickTarget(now, 160);
    };

    /* Durante o cursor roubado, nenhuma ação da página pode passar.
       O desbloqueio acontece somente quando endCarry() é chamado pelo
       próprio ciclo do mascote, ao terminar a brincadeira. */
    const blockCarryInteraction = (event) => {
      if (!S.carryActive) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    };

    /* O navegador pode cancelar um ponteiro no meio de uma interação
       (gesto de sistema, troca de app, etc.) sem nunca disparar
       "pointerup". Sem tratar isso, um clique-e-segurar no mascote
       podia ficar preso em modo "held" até o timeout de 20s. */
    const onPointerCancel = (event) => {
      if (S.carryActive) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (S.mode !== "held") return;

      setMode("walk");
      pickTarget(performance.now(), 160);
    };

    const onKeyDown = blockCarryInteraction;
    const onKeyUp = blockCarryInteraction;
    const onKeyPress = blockCarryInteraction;
    const onClick = blockCarryInteraction;
    const onDoubleClick = blockCarryInteraction;
    const onAuxClick = blockCarryInteraction;
    const onContextMenu = blockCarryInteraction;
    const onWheel = blockCarryInteraction;
    const onTouchStart = blockCarryInteraction;
    const onTouchMove = blockCarryInteraction;
    const onTouchEnd = blockCarryInteraction;
    const onDragStart = blockCarryInteraction;
    const onSelectStart = blockCarryInteraction;

    const onResize = () => {
      const b = bounds();
      S.x = clamp(S.x, b.left, b.right);
      S.y = clamp(S.y, b.top, b.bottom);
      pickTarget(performance.now(), 120);
    };

    /* Ao voltar de uma aba em segundo plano todos os prazos estão
       vencidos. Sem isso, o mascote disparava várias ações de uma
       vez no primeiro frame. */
    const onVisibility = () => {
      if (document.hidden) return;
      const now = performance.now();
      S.lastTime = 0;
      S.nextTargetAt = now + 1200;
      S.nextIdleAt = now + 2000;
      scheduleBlink(now);
      if (now > S.nextAffectionAt) scheduleAffection(now);
      if (now > S.nextStealAt) scheduleSteal(now);
      if (now > S.nextCuriousAt) scheduleCurious(now);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, {
      passive: false,
      capture: true,
    });
    window.addEventListener("pointerup", onPointerUp, {
      passive: false,
      capture: true,
    });
    window.addEventListener("pointercancel", onPointerCancel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("click", onClick, {
      passive: false,
      capture: true,
    });
    window.addEventListener("dblclick", onDoubleClick, {
      passive: false,
      capture: true,
    });
    window.addEventListener("auxclick", onAuxClick, {
      passive: false,
      capture: true,
    });
    window.addEventListener("contextmenu", onContextMenu, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", onKeyDown, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keyup", onKeyUp, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keypress", onKeyPress, {
      passive: false,
      capture: true,
    });
    window.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchstart", onTouchStart, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchend", onTouchEnd, {
      passive: false,
      capture: true,
    });
    window.addEventListener("dragstart", onDragStart, {
      passive: false,
      capture: true,
    });
    window.addEventListener("selectstart", onSelectStart, {
      passive: false,
      capture: true,
    });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    /* ----------------------------------------------------------
       INÍCIO
       ---------------------------------------------------------- */
    {
      const b = bounds();
      const now = performance.now();
      S.x = lerp(b.left, b.right, 0.2 + Math.random() * 0.6);
      S.y = lerp(b.top, b.bottom, 0.25 + Math.random() * 0.5);
      S.heading = Math.random() * TAU;
      pickTarget(now, 0);
      scheduleBlink(now);
      scheduleAffection(now);
      scheduleSteal(now);
      S.nextCuriousAt = now + 6000 + Math.random() * 14000;
      S.nextIdleAt = now + 4000;
      S.ready = true;
    }

    /* ----------------------------------------------------------
       LOCOMOÇÃO
       Todos os modos que se deslocam passam por aqui. Manter uma
       única função de andar é o que garante que a passada, a
       inclinação e a virada fiquem coerentes em qualquer estado.
       ---------------------------------------------------------- */
    const locomote = (dt, tx, ty, cruise, opts = {}) => {
      const arrive = opts.arrive ?? 34;
      const accel = opts.accel ?? 3.4;
      const turnRate = opts.turnRate ?? 5.2;

      let dx = tx - S.x;
      let dy = ty - S.y;
      const dist = Math.hypot(dx, dy);

      let desired = dist > 0.001 ? Math.atan2(dy, dx) : S.heading;

      /* Desvio das bordas: em vez de bater e quicar, ele começa a
         curvar antes de chegar na parede. */
      const b = bounds();
      const margin = 90;
      let avoidX = 0;
      let avoidY = 0;

      if (S.x - b.left < margin) avoidX += (margin - (S.x - b.left)) / margin;
      if (b.right - S.x < margin) avoidX -= (margin - (b.right - S.x)) / margin;
      if (S.y - b.top < margin) avoidY += (margin - (S.y - b.top)) / margin;
      if (b.bottom - S.y < margin)
        avoidY -= (margin - (b.bottom - S.y)) / margin;

      if (avoidX || avoidY) {
        const ax = Math.cos(desired) + avoidX * 1.6;
        const ay = Math.sin(desired) + avoidY * 1.6;
        if (Math.hypot(ax, ay) > 0.001) desired = Math.atan2(ay, ax);
      }

      const diff = angleDelta(S.heading, desired);
      const maxTurn = turnRate * dt;
      S.heading += clamp(diff, -maxTurn, maxTurn);

      /* Curva fechada obriga a reduzir a velocidade. */
      const turnPenalty = 1 - Math.min(0.75, (Math.abs(diff) / Math.PI) * 1.5);
      const slowdown =
        dist < arrive * 4 ? clamp(dist / (arrive * 4), 0.1, 1) : 1;
      const wanted = cruise * turnPenalty * (opts.ignoreArrive ? 1 : slowdown);

      S.speed += (wanted - S.speed) * accel * dt;
      S.speed = Math.max(0, S.speed);

      const step = S.speed * dt;
      S.x += Math.cos(S.heading) * step;
      S.y += Math.sin(S.heading) * step;

      /* A passada avança conforme a distância real percorrida. */
      S.stride += step / STRIDE;

      return dist;
    };

    const halt = (dt, rate = 7) => {
      S.speed *= Math.exp(-rate * dt);
      const step = S.speed * dt;
      S.x += Math.cos(S.heading) * step;
      S.y += Math.sin(S.heading) * step;
      S.stride += step / STRIDE;
    };

    /* ----------------------------------------------------------
       LOOP
       ---------------------------------------------------------- */
    let raf = 0;

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!S.ready) return;

      const dt = S.lastTime
        ? clamp((now - S.lastTime) / 1000, 1 / 240, 1 / 30)
        : 1 / 60;
      S.lastTime = now;

      const mDist = S.mouseSeen
        ? Math.hypot(S.mouseX - S.x, S.mouseY - S.y)
        : 99999;
      const mSpeed = Math.hypot(S.mouseVX, S.mouseVY);

      /* --- watchdogs de segurança ---
         O carry normal nunca passa de ~3.5s (bite + carryUntil) e o
         stalk nunca passa de 6.5s. Se algum caminho fora do fluxo
         normal impedir o término (ex.: pointercancel, aba em segundo
         plano, exceção pontual em algum frame), isso força a saída
         de qualquer forma, em vez de deixar a página travada ou o
         mascote perseguindo o cursor até a página ser recarregada. */
      if (S.carryActive && S.carryStartedAt && now - S.carryStartedAt > 6000) {
        endCarry(now);
      }

      if (
        S.mode === "stalk" &&
        S.stalkStartedAt &&
        now - S.stalkStartedAt > 9000
      ) {
        S.stalkStartedAt = 0;
        setMode("walk");
        scheduleSteal(now);
        pickTarget(now, 180);
      }

      /* --- expiração do efeito de comer --- */
      if (S.eatUntil && now >= S.eatUntil) {
        restoreEatenDot();
        S.eatUntil = 0;
        S.eatColor = "";
        S.eatHue = 30;
      }

      /* "eat" termina a mordida, mas a coloração continua até eatUntil. */
      if (S.mode === "eat" && now >= S.modeUntil) {
        setMode("idle", S.eatUntil);
        S.speed = 0;
      }

      /* --- expiração de modos temporários --- */
      /* "bite", "stalk" e "eat" não entram aqui: cada um tem a própria
         saída. Sem essa exceção o bote reagendaria errado e o
         mascote entraria em laço perseguindo o cursor sem parar. */
      if (
        S.modeUntil &&
        now >= S.modeUntil &&
        S.mode !== "bite" &&
        S.mode !== "stalk"
      ) {
        if (S.mode === "carry") endCarry(now);
        else {
          if (S.mode === "askPet") scheduleAffection(now);
          if (S.mode === "curious") scheduleCurious(now);
          setMode("walk");
          if (S.mode === "walk") pickTarget(now, 140);
        }
      }

      /* --- gatilhos de reação --- */
      const interruptible =
        S.mode === "walk" ||
        S.mode === "idle" ||
        S.mode === "sniff" ||
        S.mode === "curious" ||
        S.mode === "alert";

      if (interruptible && !reduced) {
        if (mDist < 130 && mSpeed > 1100) {
          /* movimento brusco por perto: susto */
          S.heading = Math.atan2(S.y - S.mouseY, S.x - S.mouseX);
          S.speed = Math.max(S.speed, 150);
          setMode("flee", now + 900);
        } else if (
          mDist < 150 &&
          mSpeed < 260 &&
          S.mode !== "curious" &&
          now >= S.nextCuriousAt
        ) {
          setMode("curious", now + 2600);
        } else if (S.mode === "curious" && mDist > 230) {
          setMode("walk");
          scheduleCurious(now);
        }
      }

      /* --- um único ramo de movimento roda por frame ---
         A versão anterior era uma cadeia de else-if em que alguns
         modos não casavam com nenhum ramo. Quando isso acontecia, a
         posição simplesmente não era integrada e o mascote congelava
         no ar por até um segundo. Com switch isso não ocorre. */
      switch (S.mode) {
        case "held": {
          const dx = S.mouseX + S.heldOffsetX - S.x;
          const dy = S.mouseY + S.heldOffsetY - S.y;
          S.x += dx * (1 - Math.exp(-16 * dt));
          S.y += dy * (1 - Math.exp(-16 * dt));
          S.speed = 0;
          if (Math.abs(dx) > 4) S.facing = dx > 0 ? 1 : -1;
          break;
        }

        case "bite": {
          halt(dt, 14);
          break;
        }

        case "eat": {
          halt(dt, 11);
          break;
        }

        case "carry": {
          const left = locomote(dt, S.targetX, S.targetY, S.cruise, {
            arrive: 40,
            accel: 4.2,
            turnRate: 4.4,
            ignoreArrive: true,
          });
          if (left < 50 || now >= S.carryUntil) endCarry(now);
          break;
        }

        case "flee": {
          const fx = S.x + Math.cos(S.heading) * 400;
          const fy = S.y + Math.sin(S.heading) * 400;
          locomote(dt, fx, fy, 260, {
            accel: 7,
            turnRate: 6.5,
            ignoreArrive: true,
          });
          break;
        }

        case "curious": {
          /* Aproxima devagar até uma distância confortável e para.
             Ele não encosta no cursor: fica observando a alguns
             passos, como um bicho de verdade dando uma espiada —
             não perseguindo. Velocidade e giro bem mais baixos que
             o andar normal para não parecer um robô mirando alvo. */
          const ring = 96;
          const dx = S.mouseX - S.x;
          const dy = S.mouseY - S.y;
          const d = Math.max(1, Math.hypot(dx, dy));

          if (d > ring + 34) {
            locomote(dt, S.mouseX, S.mouseY, 40, {
              arrive: ring,
              accel: 1.6,
              turnRate: 2.6,
            });
          } else if (d < ring - 38) {
            locomote(dt, S.x - (dx / d) * 160, S.y - (dy / d) * 160, 32, {
              accel: 1.6,
              turnRate: 2.6,
              ignoreArrive: true,
            });
          } else {
            halt(dt, 5);
          }
          break;
        }

        case "askPet":
        case "petted": {
          halt(dt, 9);
          break;
        }

        case "sniff":
        case "idle": {
          halt(dt, 8);
          break;
        }

        case "stalk": {
          /* Ele persegue o cursor. O usuário ainda controla o mouse
             aqui, então dá para fugir — faz parte da brincadeira. */
          const reach = locomote(dt, S.mouseX, S.mouseY, 132, {
            arrive: 30,
            accel: 4.6,
            turnRate: 6,
            ignoreArrive: true,
          });

          if (reach < 42) {
            S.stalkStartedAt = 0;
            startCarry(now);
          } else if (now >= S.modeUntil || typingNow()) {
            /* Desistiu (ou o usuário começou a digitar). */
            S.stalkStartedAt = 0;
            setMode("walk");
            scheduleSteal(now);
            pickTarget(now, 180);
          }
          break;
        }

        case "walk":
        default: {
          /* Bote espontâneo: raro, nunca enquanto se digita, e só
             se o cursor estiver visível e a uma distância razoável. */
          if (
            !reduced &&
            now >= S.nextStealAt &&
            S.mouseSeen &&
            !typingNow() &&
            mDist > 120 &&
            mDist < 620
          ) {
            setMode("stalk", now + 6500);
            S.stalkStartedAt = now;
            S.cruise = 132;
            break;
          }

          if (
            !reduced &&
            now >= S.nextAffectionAt &&
            S.mouseSeen &&
            mDist < 420
          ) {
            setMode("askPet", now + 9000);
            break;
          }

          if (now >= S.nextTargetAt) pickTarget(now, 160);

          const left = locomote(dt, S.targetX, S.targetY, S.cruise, {
            arrive: 34,
            accel: 3.2,
            turnRate: 5,
          });

          /* Chegou: dá uma pausa curta, fareja, e depois escolhe
             outro destino. É essa pausa que tira a sensação de
             robô indo de ponto em ponto sem parar. */
          if (left < 34) {
            const r = Math.random();
            setMode(
              r < 0.55 ? "sniff" : "idle",
              now + 900 + Math.random() * 2200,
            );
            S.nextTargetAt = 0;
          }
          break;
        }
      }

      /* A checagem acontece depois da integração da posição:
         o Pet pode naturalmente "cruzar" o ponto durante a caminhada. */
      tryEatNearbyDot(now);

      if (S.mode === "bite" && now >= S.modeUntil) {
        setMode("carry", S.carryUntil);
      }

      /* --- contenção rígida (rede de segurança) --- */
      const b = bounds();
      if (S.x < b.left) {
        S.x = b.left;
        S.heading = angleDelta(0, Math.PI - S.heading);
      }
      if (S.x > b.right) {
        S.x = b.right;
        S.heading = angleDelta(0, Math.PI - S.heading);
      }
      if (S.y < b.top) {
        S.y = b.top;
        S.heading = -S.heading;
      }
      if (S.y > b.bottom) {
        S.y = b.bottom;
        S.heading = -S.heading;
      }

      /* ----------------------------------------------------------
         RIG VISUAL
         ---------------------------------------------------------- */
      const norm = clamp(S.speed / 120, 0, 1);
      S.visualSpeed = lerp(S.visualSpeed, norm, 1 - Math.exp(-9 * dt));

      /* Virada: o lado é definido pela direção real e interpolado,
         então o bicho gira em vez de espelhar de um frame pro outro. */
      const dirX = Math.cos(S.heading);
      if (S.mode !== "held" && Math.abs(dirX) > 0.18 && S.speed > 12) {
        S.facing = dirX > 0 ? 1 : -1;
      }
      if (S.mode === "curious" || S.mode === "askPet") {
        const look = S.mouseX - S.x;
        if (Math.abs(look) > 24) S.facing = look > 0 ? 1 : -1;
      }
      S.facingSmooth = lerp(S.facingSmooth, S.facing, 1 - Math.exp(-11 * dt));

      /* Passada em trote diagonal. */
      const phase = S.stride * TAU;
      const amp = 15 + S.visualSpeed * 20;
      const legA = Math.sin(phase) * amp;
      const legB = Math.sin(phase + Math.PI) * amp;

      /* O corpo sobe duas vezes por ciclo (uma por apoio). */
      const bob = Math.abs(Math.sin(phase)) * (1 + S.visualSpeed * 2.2);
      const lean = clamp(S.visualSpeed * 5, 0, 5);

      /* Cauda: balanço passivo, atrasado em relação à passada. */
      const tail =
        Math.sin(phase * 0.5 - 0.7) * (5 + S.visualSpeed * 9) +
        Math.sin(now / 900) * 2;

      /* Cabeça acompanha o cursor quando ele está por perto. */
      let wantHead = Math.sin(phase + 0.5) * 2.5 * S.visualSpeed;
      if (S.mouseSeen && mDist < 260) {
        const rel = (S.mouseY - S.y) / 160;
        wantHead += clamp(rel, -1, 1) * 9 * S.facingSmooth * (S.facing || 1);
      }
      S.headTurn = lerp(
        S.headTurn,
        clamp(wantHead, -14, 14),
        1 - Math.exp(-8 * dt),
      );

      /* Piscada. */
      if (now >= S.nextBlinkAt && now >= S.blinkUntil) {
        S.blinkUntil = now + 95 + Math.random() * 70;
        scheduleBlink(now);
      }

      /* Orelha treme de vez em quando. */
      S.earTwitch =
        Math.sin(now / 137) > 0.985 ? 1 : lerp(S.earTwitch, 0, 0.15);

      const walking = S.speed > 10;

      setData("mode", S.mode);
      setData("walking", walking ? "true" : "false");
      setData("blink", now < S.blinkUntil ? "true" : "false");
      setData("facing", S.facing > 0 ? "1" : "-1");
      setData("eating", S.eatUntil > now ? "true" : "false");

      pet.style.transform =
        `translate3d(${S.x.toFixed(2)}px, ${(S.y - bob).toFixed(2)}px, 0) ` +
        `translate(-50%, -50%)`;

      const st = pet.style;
      st.setProperty("--f", S.facingSmooth.toFixed(3));
      st.setProperty("--speed", S.visualSpeed.toFixed(3));
      st.setProperty("--leg-a", `${legA.toFixed(2)}deg`);
      st.setProperty("--leg-b", `${legB.toFixed(2)}deg`);
      st.setProperty("--tail", `${tail.toFixed(2)}deg`);
      st.setProperty("--head", `${S.headTurn.toFixed(2)}deg`);
      st.setProperty("--lean", `${lean.toFixed(2)}deg`);
      st.setProperty("--bob", `${bob.toFixed(2)}px`);
      st.setProperty("--ear", S.earTwitch.toFixed(2));

      /* A cor é aplicada como uma transformação cromática no SVG inteiro.
         Assim o marrom, creme, patas, detalhes e olhos preservam seus
         contrastes, mas passam a compartilhar a tonalidade do ponto.
         Uma pequena oscilação de matiz deixa o resultado multicolorido
         em vez de uma simples "tinta" chapada. */
      const eating = S.eatUntil > now && S.eatDot;
      if (eating) {
        const hueShift = ((S.eatHue - 30 + 540) % 360) - 180;
        st.setProperty("--eat-shift", `${hueShift.toFixed(2)}deg`);
      } else {
        st.setProperty("--eat-shift", "0deg");
      }

      /* O movimento do mouse decai sozinho: se o ponteiro parar, a
         velocidade tem que voltar a zero mesmo sem novos eventos. */
      const decay = Math.exp(-9 * dt);
      S.mouseVX *= decay;
      S.mouseVY *= decay;
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      restoreEatenDot();
      S.eatUntil = 0;
      S.eatColor = "";
      setCarry(false);
      delete document.body.dataset.petCarry;

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("dblclick", onDoubleClick, true);
      window.removeEventListener("auxclick", onAuxClick, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("keypress", onKeyPress, true);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("dragstart", onDragStart, true);
      window.removeEventListener("selectstart", onSelectStart, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [S]);

  return (
    <div
      ref={layerRef}
      className="pet-layer"
      data-carry="false"
      aria-hidden="true"
    >
      <div
        ref={petRef}
        className="pet"
        data-mode="walk"
        data-walking="false"
        data-blink="false"
        data-facing="1"
        data-eating="false"
      >
        <div className="pet-shadow" />

        <div className="pet-rig">
          <svg
            className="pet-svg"
            viewBox="0 0 128 92"
            width={PET_W}
            height={PET_H}
          >
            <defs>
              <linearGradient id="gluFur" x1="0.2" y1="0" x2="0.5" y2="1">
                <stop offset="0" stopColor="#483d30" />
                <stop offset="0.45" stopColor="#2a231b" />
                <stop offset="1" stopColor="#141009" />
              </linearGradient>

              <linearGradient id="gluHead" x1="0.1" y1="0" x2="0.6" y2="1">
                <stop offset="0" stopColor="#40362b" />
                <stop offset="1" stopColor="#1b1611" />
              </linearGradient>

              <linearGradient id="gluStripe" x1="0" y1="0" x2="1" y2="0.3">
                <stop offset="0" stopColor="#a8854c" />
                <stop offset="0.45" stopColor="#e3ca90" />
                <stop offset="1" stopColor="#b8945a" />
              </linearGradient>
            </defs>

            {/* cauda */}
            <g className="pet-tail">
              <path
                d="M28,40 C21,39 13,33 7,23 C3,16 8,9 15,12 C22,16 28,26 33,34 C35,38 32,41 28,40 Z"
                fill="#171310"
              />
              <path
                d="M29,37 C23,35 16,30 11,22"
                stroke="#332c23"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>

            {/* patas do lado oposto */}
            <g className="pet-leg pet-leg--hind-far">
              <path
                d="M36,56 C34,62 33,68 34,72 C35,76 40,77 44,76 C47,75 48,72 47,68 C46,63 45,58 45,54 Z"
                fill="#0f0c0a"
              />
            </g>

            <g className="pet-leg pet-leg--fore-far">
              <path
                d="M76,54 C74,60 73,66 74,70 C75,74 80,75 84,74 C87,73 88,70 87,66 C86,61 85,56 85,52 Z"
                fill="#0f0c0a"
              />
            </g>

            {/* tronco */}
            <g className="pet-torso">
              <path
                d="M22,46 C20,31 34,20 56,20 C74,20 86,26 92,36 C95,41 94,51 88,57 C78,65 50,67 35,62 C25,58 22,53 22,46 Z"
                fill="url(#gluFur)"
              />
              <path
                d="M25,38 C27,27 38,21 56,21 C72,21 84,26 90,34"
                stroke="#6b5c46"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              />
              {/* faixa creme característica do carcaju */}
              <path
                d="M92,43 C85,35 68,31 52,33 C38,35 27,41 24,48 C27,44 34,41 46,40 C62,38 80,42 90,49 Z"
                fill="url(#gluStripe)"
                opacity="0.92"
              />
            </g>

            {/* patas da frente */}
            <g className="pet-leg pet-leg--hind-near">
              <path
                d="M40,54 C38,61 37,68 38,72 C39,77 45,78 50,77 C53,76 54,72 53,68 C52,62 51,57 51,52 Z"
                fill="#241e17"
              />
              <path
                d="M40,76 c0,2 0,2 1,2 M45,77 c0,2 0,2 1,2 M50,76 c0,2 0,2 1,2"
                stroke="#cfc3ab"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            <g className="pet-leg pet-leg--fore-near">
              <path
                d="M80,52 C78,59 77,66 78,70 C79,75 85,76 90,75 C93,74 94,70 93,66 C92,60 91,55 91,50 Z"
                fill="#241e17"
              />
              <path
                d="M80,74 c0,2 0,2 1,2 M85,75 c0,2 0,2 1,2 M90,74 c0,2 0,2 1,2"
                stroke="#cfc3ab"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* cabeça */}
            <g className="pet-head">
              <g className="pet-ear pet-ear--back">
                <path
                  d="M93,31 C91,26 94,23 98,24 C101,25 102,29 100,32 Z"
                  fill="#2a231b"
                />
              </g>
              <g className="pet-ear pet-ear--front">
                <path
                  d="M107,30 C106,25 109,22 113,24 C116,26 116,30 114,32 Z"
                  fill="#2a231b"
                />
              </g>

              <path
                d="M82,38 C86,31 97,29 107,32 C116,35 123,42 122,48 C121,54 114,58 105,59 C95,60 86,56 82,49 C79,45 79,42 82,38 Z"
                fill="url(#gluHead)"
              />

              <path
                d="M89,40 C95,33 107,33 116,39 C110,36 99,35 91,42 Z"
                fill="#c7a76e"
                opacity="0.6"
              />

              <path
                d="M111,44 C118,43 122,46 122,49 C121,53 116,56 110,55 C107,51 107,46 111,44 Z"
                fill="#3e342a"
              />

              <g className="pet-eye">
                <ellipse cx="100" cy="42" rx="3.1" ry="2.7" fill="#f4d97a" />
                <ellipse cx="101.2" cy="42" rx="1.2" ry="2" fill="#1a1208" />
                <rect
                  className="pet-lid"
                  x="96.6"
                  y="38.9"
                  width="7"
                  height="6.4"
                  fill="#241e17"
                />
              </g>

              <path
                className="pet-brow"
                d="M96,38 C99,36 103,36 105,38"
                stroke="#0f0c0a"
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
              />

              <ellipse cx="121" cy="47" rx="2.7" ry="2.3" fill="#0b0908" />
              <path
                className="pet-mouth"
                d="M118,52 C115,54 112,54 110,52"
                stroke="#0b0908"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* O cursor roubado vive dentro do mascote e é ancorado ao
            focinho pelo CSS. Antes ele era reposicionado por JS a
            cada frame e chegava a dessincronizar do bicho. */}
        <div className="pet-cursor-proxy">
          <svg viewBox="0 0 12 18" width="12" height="18">
            <path
              d="M1,1 L1,14.5 L4.4,11.4 L6.6,16.6 L9,15.5 L6.9,10.5 L11,10.2 Z"
              fill="#ffffff"
              stroke="#12101a"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="pet-heart">♥</div>
        <div className="pet-startle">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default Pet;
