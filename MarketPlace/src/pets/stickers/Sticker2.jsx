import { forwardRef } from "react";
import "./Sticker2.css";

export const STICKER_2_POWERS = [
  {
    id: "kamehameha",
    name: "Kamehameha",
    anime: "Dragon Ball",
    animation: "beam",
    kind: "chargeBeam",
    damage: 28,
    cooldown: 270,
    range: 760,
  },
  {
    id: "hinokami",
    name: "Hinokami Kagura",
    anime: "Demon Slayer",
    animation: "slash",
    kind: "danceSlash",
    damage: 17,
    cooldown: 150,
    range: 300,
  },
  {
    id: "detroitSmash",
    name: "Detroit Smash",
    anime: "My Hero Academia",
    animation: "heavyPunch",
    kind: "smash",
    damage: 25,
    cooldown: 195,
    range: 120,
  },
  {
    id: "rapidFire",
    name: "Rapid Fire",
    anime: "Fire Force",
    animation: "beam",
    kind: "multiShot",
    damage: 6,
    cooldown: 160,
    range: 620,
  },
  {
    id: "blackDivider",
    name: "Black Divider",
    anime: "Black Clover",
    animation: "slash",
    kind: "blade",
    damage: 18,
    cooldown: 140,
    range: 470,
  },
  {
    id: "chainsawRush",
    name: "Chainsaw Rush",
    anime: "Chainsaw Man",
    animation: "rush",
    kind: "chainsaw",
    damage: 7,
    cooldown: 170,
    range: 330,
  },
  {
    id: "seriousPunch",
    name: "Serious Punch",
    anime: "One Punch Man",
    animation: "heavyPunch",
    kind: "shockPunch",
    damage: 32,
    cooldown: 280,
    range: 500,
  },
  {
    id: "soulResonance",
    name: "Soul Resonance",
    anime: "Soul Eater",
    animation: "summon",
    kind: "resonance",
    damage: 15,
    cooldown: 165,
    range: 360,
  },
  {
    id: "windScar",
    name: "Wind Scar",
    anime: "Inuyasha",
    animation: "slash",
    kind: "tripleWave",
    damage: 10,
    cooldown: 135,
    range: 600,
  },
  {
    id: "thunderSpear",
    name: "Thunder Spear",
    anime: "Attack on Titan",
    animation: "beam",
    kind: "explosive",
    damage: 20,
    cooldown: 175,
    range: 540,
  },
  {
    id: "atField",
    name: "AT Field",
    anime: "Neon Genesis Evangelion",
    animation: "charge",
    kind: "barrier",
    damage: 8,
    cooldown: 210,
    range: 190,
  },
  {
    id: "transmutation",
    name: "Alchemical Transmutation",
    anime: "Fullmetal Alchemist",
    animation: "summon",
    kind: "terrain",
    damage: 21,
    cooldown: 220,
    range: 380,
  },
];

const Sticker2 = forwardRef(function Sticker2(
  { state = "IDLE", power = null, airborne = false },
  ref,
) {
  return (
    <div
      ref={ref}
      className="sticker-fighter-instance sticker-two sticker-red"
      data-state={state}
      data-air={airborne}
      data-power={power?.id || ""}
    >
      <div className="runtime-aura" />
      <svg className="runtime-svg" viewBox="0 0 100 150" aria-hidden="true">
        <g className="stickman-shadow">
          <ellipse cx="50" cy="143" rx="21" ry="3.5" />
        </g>
        <g
          className="runtime-body"
          style={{
            transform: "rotate(var(--pose-body, 0deg))",
            transformOrigin: "50px 82px",
          }}
        >
          <circle
            className="stick-head"
            cx="50"
            cy="31"
            r="11"
            style={{
              transform: "rotate(var(--pose-head, 0deg))",
              transformOrigin: "50px 31px",
            }}
          />
          <g className="stick-eyes">
            <circle cx="46" cy="29" r="1.35" />
            <circle cx="46" cy="34" r="1.35" />
          </g>
          <path className="stick-line torso" d="M50 42 L50 82" />
          <path
            className="stick-line arm-back"
            d="M50 50 L65 68 L75 59"
            style={{
              transform: "rotate(var(--pose-arm-back, 0deg))",
              transformOrigin: "50px 50px",
            }}
          />
          <path
            className="stick-line arm-front"
            d="M50 52 L33 61 L21 48"
            style={{
              transform: "rotate(var(--pose-arm-front, 0deg))",
              transformOrigin: "50px 52px",
            }}
          />
          <path
            className="stick-line leg-back"
            d="M50 82 L63 111 L71 133"
            style={{
              transform: "rotate(var(--pose-leg-back, 0deg))",
              transformOrigin: "50px 82px",
            }}
          />
          <path
            className="stick-line leg-front"
            d="M50 82 L35 107 L22 127"
            style={{
              transform: "rotate(var(--pose-leg-front, 0deg))",
              transformOrigin: "50px 82px",
            }}
          />
          <circle className="stick-hand front-hand" cx="21" cy="48" r="3" />
          <path className="stick-foot" d="M71 133 L79 136" />
          <path className="stick-foot" d="M22 127 L15 129" />
        </g>
        <g className="hand-energy">
          <circle cx="21" cy="48" r="7" />
          <circle cx="21" cy="48" r="2.8" />
        </g>
        {/* Foice — haste longa + lâmina curva, forma original.
            Presa ao mesmo giro do braço da frente, igual a espada
            do azul. Só aparece com data-armado="true". */}
        <g
          className="arma-visual arma-foice"
          style={{
            transform: "rotate(var(--pose-arm-front, 0deg))",
            transformOrigin: "50px 52px",
          }}
        >
          <path className="arma-haste" d="M21,48 L-8,20" />
          <path className="arma-lamina" d="M-8,20 Q-28,14 -30,-4 Q-24,6 -12,10" />
          <circle className="arma-pomo" cx="21" cy="48" r="2.2" />
        </g>
      </svg>
      <span className="runtime-name">RED</span>
    </div>
  );
});

export default Sticker2;