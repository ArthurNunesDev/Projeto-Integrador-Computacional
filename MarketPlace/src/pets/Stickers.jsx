import { useEffect, useRef } from "react";
import "./Stickers.css";
import Sticker1, { STICKER_1_POWERS } from "./stickers/Sticker1";
import Sticker2, { STICKER_2_POWERS } from "./stickers/Sticker2";
import { obterPose, aplicarPose } from "./animation/animation";
import { BASICOS } from "./battle/basic";
import { DURACAO_ARMA_MS } from "./animation/weapons";
import { montarRepertorio } from "./battle/repertory";
import { marcarUso, escolherPronto } from "./battle/cooldowns";
import { registrarAcerto, bonusCombo } from "./battle/combos";

const W = 54,
  H = 82,
  FLOOR = 22,
  GRAVITY = 0.42,
  AIR_DRAG = 0.985,
  GROUND_DRAG = 0.85,
  WALL = 0.72;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => Math.random() * (b - a) + a;

const makeFighter = (color) => ({
  color,
  x: 0,
  y: 0,
  vx: color === "blue" ? 2 : -2,
  vy: 0,
  facing: color === "blue" ? 1 : -1,
  state: "IDLE",
  stateTime: 0,
  hp: 100,
  shield: 0,
  airborne: false,
  power: null,
  hitLock: 0,
  animationTime: 0,
  decision: rand(20, 40),
  invulnerable: 0,
  lastHitDirection: color === "blue" ? 1 : -1,
  crossUntil: 0,
  /* Cada golpe (básico, especial, arma ou mobilidade) recarrega
     por conta própria — ver combate/cooldowns.js. */
  cooldowns: {},
  armado: false,
  armaAte: 0,
  /* Sequência de acertos em andamento — ver combate/combos.js. */
  combo: null,
});

export default function Stikers() {
  const rootRef = useRef(null),
    blueRef = useRef(null),
    redRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current,
      be = blueRef.current,
      re = redRef.current;
    if (!root || !be || !re) return;

    const fx = root.querySelector(".runtime-effects");
    const st = { blue: makeFighter("blue"), red: makeFighter("red") };
    const items = [];
    /* Fase de combate aéreo: de vez em quando os dois decolam
       juntos e brigam pela página inteira, depois pousam e voltam
       ao combate no chão. Também é aqui, na perseguição livre em
       2D, que trocar de lado acontece com naturalidade — voando,
       não tem "lado" fixo, um passa pelo outro na perseguição. */
    const world = {
      flying: false,
      nextFlightAt: performance.now() + rand(9000, 16000),
      flightUntil: 0,
      combatY: 0,
      nextAltitudeAt: 0,
    };
    let mounted = true,
      last = performance.now(),
      raf = 0;

    const arena = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      return { w, h, floor: h - H - FLOOR };
    };

    const reset = () => {
      const a = arena();
      st.blue.x = clamp(a.w * 0.2, 8, a.w - W - 8);
      st.red.x = clamp(a.w * 0.8 - W, 8, a.w - W - 8);
      st.blue.y = st.red.y = a.floor;
    };
    reset();

    const effect = (kind, x, y, o = {}) => {
      const e = document.createElement("span");
      e.className = `runtime-effect runtime-effect-${kind} effect-${o.color || "neutral"}`;
      e.style.left = `${x}px`;
      e.style.top = `${y}px`;
      if (o.text) e.textContent = o.text;
      if (o.angle !== undefined)
        e.style.setProperty("--angle", `${o.angle}deg`);
      fx.appendChild(e);

      const p = {
        el: e,
        born: performance.now(),
        life: o.life || 420,
        vx: o.vx || 0,
        vy: o.vy || 0,
        owner: o.owner,
        damage: o.damage || 0,
        hit: false,
        gravity: o.gravity || 0,
        radius: o.radius || 28,
      };
      items.push(p);
      return p;
    };

    const hit = (a, t, d, kx, ky, strong = false) => {
      if (t.hitLock > 0 || t.invulnerable > 0) return false;
      const agora = performance.now();
      const combo = registrarAcerto(a, agora);
      const dano = d * bonusCombo(combo);
      t.hp = Math.max(1, t.hp - dano);
      t.vx += kx;
      t.vy += ky;
      t.airborne = true;
      t.hitLock = strong ? 14 : 6;
      t.state = strong ? "HIT" : "STUN";
      t.stateTime = strong ? 30 : 14;
      t.lastHitDirection = Math.sign(kx) || 1;
      effect("impact", t.x + W / 2, t.y + H * 0.4, { color: a.color });
      if (combo >= 2) {
        effect("label", a.x + W / 2, a.y - 12, {
          color: a.color,
          text: `Combo x${combo}!`,
          life: 650,
        });
      }
      return true;
    };

    const projectile = (f, t, o = {}) => {
      const x = f.x + W / 2,
        y = f.y + H * 0.38;
      const tx = t.x + W / 2,
        ty = t.y + H * 0.38;
      const ang = Math.atan2(ty - y, tx - x);
      const speed = o.speed || 8.5;
      return effect(o.visual || "projectile", x, y, {
        color: f.color,
        life: o.life || 1000,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        owner: f.color,
        damage: o.damage || 8,
        radius: o.radius || 28,
        angle: (ang * 180) / Math.PI,
      });
    };

    const usarGolpe = (f, t, golpe, now) => {
      if (!golpe || f.hitLock > 0) return;
      marcarUso(f, golpe.id, now, golpe.cooldown * 16.67);

      /* Invocar a arma não é um golpe: só liga o estado "armado"
         por um tempo e some. Não passa pelo resto da função. */
      if (golpe.kind === "arma_invocar") {
        f.power = golpe;
        f.state = "ATTACK";
        f.stateTime = 24;
        f.armado = true;
        f.armaAte = now + DURACAO_ARMA_MS;
        effect("label", f.x + W / 2, f.y - 12, {
          color: f.color,
          text: golpe.name,
          life: 800,
        });
        return;
      }

      /* Passo relâmpago: teleporta pra perto do oponente AGORA (não
         é uma corrida — é um avanço instantâneo) e golpeia na
         chegada. Não usa o fluxo genérico de dash/projétil abaixo. */
      if (golpe.kind === "mobilidade") {
        f.power = golpe;
        f.state = "ATTACK";
        f.stateTime = 18;
        const lado = f.facing;
        effect("rastro", f.x + W / 2, f.y + H * 0.4, {
          color: f.color,
          life: 240,
        });
        const a = arena();
        f.x = clamp(t.x - lado * 44, 4, a.w - W - 4);
        f.vx = 0;
        effect("rastro", f.x + W / 2, f.y + H * 0.4, {
          color: f.color,
          life: 240,
        });
        setTimeout(() => {
          if (!mounted) return;
          const d = Math.hypot(
            t.x + W / 2 - (f.x + W / 2),
            t.y + H / 2 - (f.y + H / 2),
          );
          if (d < golpe.range) hit(f, t, golpe.damage, lado * 9, -4, true);
        }, 70);
        return;
      }

      f.power = golpe;
      f.state = ["chargeBeam", "ultimate"].includes(golpe.kind)
        ? "SPECIAL"
        : "ATTACK";
      f.stateTime = 28;

      /* Golpes básicos não ganham etiqueta com nome — mostrar
         "Jab", "Cruzado" etc. toda hora poluiria a tela. As
         etiquetas ficam só pras habilidades que merecem destaque. */
      if (golpe.kind !== "basico") {
        effect("label", f.x + W / 2, f.y - 12, {
          color: f.color,
          text: golpe.name,
          life: 800,
        });
      }

      const dir = f.facing;
      /* O campo que descreve de verdade o visual do golpe é
         `animation` (é ele que a lore/nome do poder combina com o
         estilo), não `kind` — e `kind` tem nomes livres por poder
         ("chargeBeam", "sniper", "ultimate", "multiShot",
         "explosive"...) que nunca batiam com a string "beam".
         Resultado: Kamehameha, Excalibur, Spirit Gun, Rapid Fire e
         Thunder Spear — cinco dos seis golpes com animation:"beam"
         — carregavam a pose e mostravam o nome, mas nunca disparavam
         nada. Só Dragon Roar (kind literalmente "beam") funcionava. */
      const isBeam = golpe.animation === "beam";
      if (golpe.kind === "homing" || golpe.kind === "wave" || isBeam) {
        projectile(f, t, {
          speed: isBeam ? 13 : 9,
          damage: golpe.damage,
          visual: isBeam ? "beam" : "projectile",
          life: isBeam ? 550 : 1000,
        });
      } else {
        f.vx = dir * 8;
        /* Básicos e golpes de arma só acertam se o oponente ainda
           estiver perto quando o golpe chega — sem isso, "trocar
           soco" viraria "acertar à distância", já que o dash por
           si só não garante proximidade real. As 24 habilidades
           nomeadas originais mantêm o comportamento de sempre
           (sempre acertam), pra não mudar nada que já funcionava. */
        const precisaDistancia = ["basico", "arma_golpe"].includes(golpe.kind);
        setTimeout(() => {
          if (!mounted) return;
          if (!precisaDistancia) {
            hit(f, t, golpe.damage, dir * 10, -4, true);
            return;
          }
          const d = Math.hypot(
            t.x + W / 2 - (f.x + W / 2),
            t.y + H / 2 - (f.y + H / 2),
          );
          if (d < (golpe.range || 90))
            hit(f, t, golpe.damage, dir * 10, -4, true);
        }, 100);
      }
    };

    const decidirGolpe = (f, t, dist, now) => {
      const especiais =
        f.color === "blue" ? STICKER_1_POWERS : STICKER_2_POWERS;
      /* A maior parte do tempo é soco/chute básico — as habilidades
         nomeadas, a arma e o passo relâmpago são o tempero
         ocasional, não a base da luta. */
      if (Math.random() < 0.32) {
        /* O passo relâmpago é pra FECHAR distância — usá-lo já
           colado no oponente seria um teleporte de 40px sem
           sentido nenhum visualmente. Só entra no sorteio quando
           realmente há alguma distância pra cobrir. */
        const repertorio = montarRepertorio(f, especiais).filter(
          (g) => g.kind !== "mobilidade" || dist > 110,
        );
        const pronto = escolherPronto(f, repertorio, now);
        if (pronto) return pronto;
      }
      /* Básico só faz sentido perto — longe, o alcance dele (46 a
         92px) nunca vai bater mesmo, e o soco no vazio fica
         estranho de ver. As habilidades nomeadas de sempre não
         têm essa checagem (mantém o comportamento original). */
      if (dist < 160)
        return BASICOS[Math.floor(Math.random() * BASICOS.length)];
      return null;
    };

    const update = (f, t, el, dt, a, now) => {
      const s = dt / 16.67;
      f.hitLock = Math.max(0, f.hitLock - s);
      f.invulnerable = Math.max(0, f.invulnerable - s);
      f.stateTime -= s;
      f.animationTime += s;

      if (f.armado && now >= f.armaAte) f.armado = false;

      const c = { x: f.x + W / 2, y: f.y + H / 2 };
      const tc = { x: t.x + W / 2, y: t.y + H / 2 };
      const dx = tc.x - c.x;
      const dy = tc.y - c.y;
      const dist = Math.hypot(dx, dy);
      f.facing = dx >= 0 ? 1 : -1;

      // IA DE MOVIMENTAÇÃO
      /* Decisão só é tomada em IDLE de verdade. Golpes básicos
         agora disparam com um intervalo bem mais curto que antes
         (pra virar o "feijão com arroz" da luta) — se ATTACK/JUMP
         continuassem liberados pra tomar nova decisão, uma segunda
         decisão podia disparar ANTES do golpe atual terminar,
         reescrevendo f.power/f.stateTime no meio da animação. Isso
         corrompe a pose: faseLocal() só reinicia quando o `state`
         muda, então um segundo golpe começado ainda dentro do mesmo
         "ATTACK" nasceria com a fase já adiantada, pulando o começo
         do movimento. Excluindo ATTACK e JUMP daqui, todo golpe
         sempre termina antes que o próximo possa começar. */
      if (!["HIT", "STUN", "SPECIAL", "ATTACK", "JUMP"].includes(f.state)) {
        f.decision -= s;
        if (f.decision <= 0) {
          f.decision = rand(24, 42); // Decisões mais frequentes: base agora é golpe básico

          if (
            !world.flying &&
            !f.airborne &&
            dist < 140 &&
            Math.random() < 0.08
          ) {
            // Pulo controlado e raro (Apenas em combate próximo)
            f.vy = -rand(8, 10);
            f.airborne = true;
            f.state = "JUMP";
            f.stateTime = 20;
          } else if (!world.flying && dist < 150 && Math.random() < 0.1) {
            /* Investida rápida cruzando pro outro lado do oponente
               — sem isso, o back-off automático abaixo de 85px
               nunca deixa um passar pelo outro, e "esquerda"/
               "direita" ficam fixos o tempo todo. */
            f.crossUntil = now + rand(550, 900);
          } else {
            const golpe = decidirGolpe(f, t, dist, now);
            if (golpe) usarGolpe(f, t, golpe, now);
          }
        }

        if (world.flying) {
          /* Horizontal: persegue/afasta do oponente de verdade (é
             isso que cria o cruzamento de caminhos e troca de
             lado). Vertical: busca a altitude compartilhada
             (world.combatY), não a altura exata do oponente — COM
             a altura exata, os dois cancelam a subida inicial quase
             na hora sempre que começam emparelhados na mesma altura
             (o caso mais comum, já que decolam do chão juntos). */
          const dyAlvo = world.combatY - c.y;
          const distXY = Math.max(1, Math.hypot(dx, dyAlvo));
          const alvo = dist > 78 ? 3.6 : -1.8;
          const ux = dx / distXY;
          const uy = dyAlvo / distXY;
          f.vx += (ux * alvo - f.vx) * 0.07 * s;
          f.vy += (uy * alvo - f.vy) * 0.07 * s;
        } else {
          const investindo = f.crossUntil && now < f.crossUntil;
          const targetSpeed = investindo
            ? f.facing * 6
            : dist > 85
              ? f.facing * 3
              : -f.facing * 1.5;
          f.vx += (targetSpeed - f.vx) * 0.08 * s;
        }
      }

      // Física
      if (world.flying) {
        f.airborne = true;
        f.vy *= Math.pow(AIR_DRAG, s);
      } else {
        f.vy += GRAVITY * s;
      }
      f.x += f.vx * s;
      f.y += f.vy * s;
      f.vx *= Math.pow(f.airborne ? AIR_DRAG : GROUND_DRAG, s);

      if (f.stateTime <= 0) f.state = "IDLE";

      // Limites da tela
      if (f.x <= 4) {
        f.x = 4;
        f.vx = -f.vx * WALL;
      }
      if (f.x >= a.w - W - 4) {
        f.x = a.w - W - 4;
        f.vx = -f.vx * WALL;
      }

      if (world.flying) {
        /* Ocupam a página inteira, não só perto do chão. */
        const minY = 24;
        const maxY = a.h - H - 24;
        if (f.y < minY) {
          f.y = minY;
          f.vy = Math.abs(f.vy) * 0.4;
        }
        if (f.y > maxY) {
          f.y = maxY;
          f.vy = -Math.abs(f.vy) * 0.4;
        }
      } else if (f.y >= a.floor) {
        // Chão
        f.y = a.floor;
        f.vy = 0;
        f.airborne = false;
      }

      // Aplicação da pose
      const pose = obterPose({
        state: f.state,
        tempo: f.animationTime,
        velocidade: f.vx,
        vy: f.vy,
        power: f.power,
        variante: f.color,
        hitDirection: f.lastHitDirection,
        facing: f.facing,
        voando: world.flying,
      });
      aplicarPose(el, pose);

      el.dataset.state = f.state;
      el.dataset.air = String(f.airborne);
      el.dataset.armado = String(f.armado);
      /* O espelhamento fica só no boneco (svg), não no elemento
         inteiro: aplicar scaleX aqui em cima espelhava também a
         etiqueta de nome, e "RED" virava "Q3R" na tela. */
      el.style.transform = `translate3d(${f.x}px,${f.y}px,0)`;
      const svg = el.querySelector(".runtime-svg");
      if (svg) svg.style.transform = `scaleX(${f.facing})`;
    };

    const updateItems = (dt) => {
      for (let i = items.length - 1; i >= 0; i--) {
        const p = items[i];
        const s = dt / 16.67;
        p.vy += p.gravity * s;
        p.el._x = (p.el._x ?? parseFloat(p.el.style.left)) + p.vx * s;
        p.el._y = (p.el._y ?? parseFloat(p.el.style.top)) + p.vy * s;
        p.el.style.left = `${p.el._x}px`;
        p.el.style.top = `${p.el._y}px`;

        /* "label" e "impact" também passam por aqui (effect() bota
           TUDO em items, não só projéteis de verdade) mas nascem sem
           owner. Sem essa guarda, a etiqueta do nome do golpe — que
           aparece bem em cima da cabeça de quem usou — quase sempre
           cai dentro do raio de colisão do próprio lutador, e
           `p.owner === "blue" ? ... : "blue"` resolve pra "blue" por
           padrão mesmo quando owner é undefined. Isso chamava
           hit(undefined, ...) e travava a simulação inteira na
           primeira vez que qualquer golpe era usado — por isso
           quase nenhuma habilidade chegava a aparecer. */
        if (!p.owner) continue;

        const t = st[p.owner === "blue" ? "red" : "blue"];
        if (
          !p.hit &&
          Math.hypot(p.el._x - (t.x + W / 2), p.el._y - (t.y + H / 2)) <
            p.radius
        ) {
          p.hit = true;
          hit(st[p.owner], t, p.damage, p.vx * 0.5, -2, p.damage > 20);
          p.life = 0;
        }
      }
    };

    const frame = (now) => {
      if (!mounted) return;
      const dt = Math.min(32, now - last);
      last = now;
      const a = arena();

      if (
        !world.flying &&
        now >= world.nextFlightAt &&
        st.blue.state === "IDLE" &&
        st.red.state === "IDLE"
      ) {
        /* Decolam juntos — o combate aéreo é uma fase que os dois
           compartilham, não um lutador voando sozinho enquanto o
           outro fica parado no chão sem sentido. */
        world.flying = true;
        world.flightUntil = now + rand(7000, 13000);
        world.combatY = rand(0.12, 0.5) * a.h;
        world.nextAltitudeAt = now + rand(2500, 4500);
        for (const f of [st.blue, st.red]) {
          f.vy = -rand(7, 10);
          f.airborne = true;
        }
      } else if (world.flying && now >= world.flightUntil) {
        world.flying = false;
        world.nextFlightAt = now + rand(11000, 20000);
      }

      if (world.flying && now >= world.nextAltitudeAt) {
        /* Muda de altura de vez em quando — sem isso os dois ficam
           perseguindo a altura exata um do outro pra sempre, e como
           começam colados no chão, a subida inicial é cancelada
           quase na hora e a "luta voando" nunca sai de perto do
           piso. */
        world.combatY = rand(0.1, 0.55) * a.h;
        world.nextAltitudeAt = now + rand(2500, 4500);
      }

      update(st.blue, st.red, be, dt, a, now);
      update(st.red, st.blue, re, dt, a, now);
      updateItems(dt);

      for (let i = items.length - 1; i >= 0; i--) {
        if (now - items[i].born >= items[i].life) {
          items[i].el.remove();
          items.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("resize", reset);
    raf = requestAnimationFrame(frame);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reset);
      items.forEach((p) => p.el.remove());
    };
  }, []);

  return (
    <div ref={rootRef} className="stickers-physics-runtime" aria-hidden="true">
      <div className="stickers-runtime-stage">
        <div className="runtime-portal" />
        <div className="runtime-effects" />
        <Sticker1 ref={blueRef} />
        <Sticker2 ref={redRef} />
      </div>
    </div>
  );
}
