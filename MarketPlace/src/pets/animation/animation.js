import { walk as andar } from "./walk";
import { run as correr } from "./run";
import { jump as pular } from "./jump";
import { attack as atacar } from "./attack";
import { special as especial } from "./special";
import { damage as dano } from "./damage";
import { fall as cair } from "./fall";
import { defend as defender } from "./defend";

/* =========================================================
   ANIMAÇÃO — combina os 8 geradores de pose num único
   obterPose(), que é o que Stickers.jsx realmente chama.

   Cada gerador (andar, correr, pular, atacar, especial, dano,
   cair, defender) devolve ângulos crus em graus: { body, head,
   armFront, armBack, legFront, legBack, x, y, lean, ... }.
   Esse arquivo decide QUAL gerador usar a cada frame e traduz
   o resultado pras variáveis CSS que Sticker1.jsx/Sticker2.jsx
   já consomem (--pose-body, --pose-head, --pose-arm-front,
   --pose-arm-back, --pose-leg-front, --pose-leg-back).

   x, y, lean, shield e shieldPulse também são repassados como
   --pose-x, --pose-y, --pose-lean, --pose-shield e
   --pose-shield-pulse. Hoje nenhum desses tem efeito visual
   porque os componentes atuais só leem os 6 ângulos de rotação
   — mas os valores já ficam disponíveis no elemento, prontos
   pra ligar num translate/skew ou num anel de escudo no CSS
   quando quiser, sem mexer em JS de novo.
   ========================================================= */

/* Duração, em unidades de "tempo" (≈ frames a 60fps), de um
   golpe. Precisa bater com o `f.stateTime = 28` que Stickers.jsx
   usa em usePower() — se aquele número mudar lá, ajuste aqui
   também, senão o soco anima rápido/lento demais em relação ao
   tempo real do estado ATTACK/SPECIAL. */
const ATTACK_DURATION = 28;

/* Mapeia o campo `animation` de cada poder (definido em
   STICKER_1_POWERS / STICKER_2_POWERS) para o estilo que
   atacar.js e especial.js entendem. Poderes com um `animation`
   fora dessas listas caem no estilo padrão de cada gerador. */
const ATTACK_STYLES = new Set(["punch", "heavyPunch", "kick", "slash", "rush"]);
const SPECIAL_STYLES = new Set(["charge", "beam", "spin", "summon"]);

/* Cada lutador (blue/red) precisa saber "desde quando" está no
   estado atual, pra golpes e quedas animarem a partir do zero
   em vez de começarem no meio de uma onda senoidal. Isso é
   guardado aqui dentro — obterPose continua sendo chamado do
   mesmo jeito que Stickers.jsx já chama, nada muda pra quem usa. */
const tracked = {};

function faseLocal(variante, state, tempo) {
  const t =
    tracked[variante] || (tracked[variante] = { state: null, since: 0 });
  if (t.state !== state) {
    t.state = state;
    t.since = tempo;
  }
  return Math.max(0, tempo - t.since);
}

/* Pose de repouso: a única parte do protótipo anterior que já
   funcionava bem e não tinha um gerador dedicado nesta leva de
   arquivos, então mantemos ela tal como estava. */
function respirar(tempo) {
  const breath = Math.sin(tempo * 0.08) * 3;
  return {
    body: breath,
    head: -breath * 0.5,
    armFront: 10,
    armBack: -10,
    legFront: 5,
    legBack: -5,
    x: 0,
    y: 0,
    lean: 0,
  };
}

/* Cada lutador precisa de um "hodômetro": quanto ele já andou no
   chão, em pixels reais — e não o relógio — é isso que deve
   controlar a velocidade do ciclo de passada. Sem isso, as pernas
   balançam sempre no mesmo ritmo de TEMPO, então andando devagar
   elas trocam de direção a cada ~4px (parecem tremer no lugar) e
   andando rápido a cada ~18px — o "deslizar"/patinação que fica
   estranho. Medido rodando o protótipo, antes desta correção. */
const odometro = {};

function distanciaAndada(variante, tempo, absVx) {
  const o =
    odometro[variante] || (odometro[variante] = { lastTempo: tempo, dist: 0 });
  const dt = Math.max(0, Math.min(4, tempo - o.lastTempo));
  o.lastTempo = tempo;
  o.dist += absVx * dt;
  return o.dist;
}

/* Histerese entre parado/andar/correr. A IA só usa duas
   velocidades-alvo (1.5 ao recuar, 3 ao aproximar) e leva ~12
   frames de aceleração suave pra chegar lá, então passa bastante
   tempo em valores intermediários perto dos limiares. Sem
   histerese, cada frame podia escolher um gerador de pose
   diferente, e a troca abrupta de fórmula pipoca visualmente.
   Entrar num ritmo mais rápido exige passar de um limiar mais
   alto; voltar a um mais lento, de um mais baixo. */
const marcha = {};

function escolherMarcha(variante, absVx) {
  const atual = marcha[variante] || "parado";
  let novo = atual;
  if (atual === "parado") {
    if (absVx > 0.4) novo = "andar";
  } else if (atual === "andar") {
    if (absVx < 0.25) novo = "parado";
    else if (absVx > 2.2) novo = "correr";
  } else if (absVx < 1.5) {
    novo = "andar";
  }
  marcha[variante] = novo;
  return novo;
}

/* Converte pixels percorridos no argumento de "tempo" que
   andar()/correr() esperam. As duas primeiras tentativas erraram
   pra lados opostos (0.09 deixava a passada em câmera lenta, ~2.7s
   por ciclo; o valor abaixo foi calculado pra dar ~0.5s por ciclo
   na velocidade de aproximação típica (~2.2px/frame) e conferido
   depois medindo quantos pixels o lutador percorre por troca de
   perna). */
const STEP_SCALE = 0.49;

function poseParado(variante, state, tempo, velocidade, vy) {
  const absVx = Math.abs(velocidade);

  if (vy !== 0) return pular(tempo, vy, variante);

  const dist = distanciaAndada(variante, tempo, absVx);
  const m = escolherMarcha(variante, absVx);

  if (m === "parado") return respirar(tempo);
  if (m === "andar") {
    return andar(dist * STEP_SCALE, clamp01(absVx / 1.8, 0.3, 1), variante);
  }
  return correr(dist * STEP_SCALE, clamp01(absVx / 3, 0.5, 1.6), variante);
}

function clamp01(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function obterPose({
  state,
  tempo = 0,
  velocidade = 0,
  vy = 0,
  power = null,
  variante = "blue",
  hitDirection = 1,
}) {
  let raw;

  if (state === "HIT" || state === "STUN") {
    const local = faseLocal(variante, state, tempo);
    const intensidade = state === "HIT" ? 1 : 0.6;
    raw = dano(local, intensidade, hitDirection || 1);
  } else if (state === "DOWN") {
    const local = faseLocal(variante, state, tempo);
    raw = cair(local, 1, hitDirection || 1);
  } else if (state === "DEFEND") {
    raw = defender(tempo, 1, variante);
  } else if (state === "SPECIAL") {
    const local = faseLocal(variante, state, tempo);
    const anim = power?.animation;
    const estilo = SPECIAL_STYLES.has(anim) ? anim : "spin";
    raw = especial(local, estilo);
  } else if (state === "ATTACK") {
    const local = faseLocal(variante, state, tempo);
    const anim = power?.animation;
    const estilo = ATTACK_STYLES.has(anim) ? anim : "punch";
    const fase = clamp01(local / ATTACK_DURATION, 0, 1);
    raw = atacar(local, fase, estilo);
  } else if (vy !== 0 || state === "JUMP") {
    raw = pular(tempo, vy, variante);
  } else {
    raw = poseParado(variante, state, tempo, velocidade, vy);
  }

  return {
    "--pose-body": `${raw.body ?? 0}deg`,
    "--pose-head": `${raw.head ?? 0}deg`,
    "--pose-arm-front": `${raw.armFront ?? 0}deg`,
    "--pose-arm-back": `${raw.armBack ?? 0}deg`,
    "--pose-leg-front": `${raw.legFront ?? 0}deg`,
    "--pose-leg-back": `${raw.legBack ?? 0}deg`,
    "--pose-x": `${raw.x ?? 0}px`,
    "--pose-y": `${raw.y ?? 0}px`,
    "--pose-lean": `${raw.lean ?? 0}deg`,
    "--pose-shield": `${raw.shield ?? 0}`,
    "--pose-shield-pulse": `${raw.shieldPulse ?? 1}`,
  };
}

export function aplicarPose(elemento, pose) {
  if (!elemento) return;
  Object.entries(pose).forEach(([chave, valor]) => {
    elemento.style.setProperty(chave, valor);
  });
}
