import { forwardRef } from "react";
import "./Sticker1.css";

export const STICKER_1_POWERS = [
  {
    id: "rasengan",
    name: "Rasengan",
    anime: "Naruto",
    animation: "punch",
    kind: "homing",
    damage: 11,
    cooldown: 90,
    range: 310,
  },
  {
    id: "getsuga",
    name: "Getsuga Tensho",
    anime: "Bleach",
    animation: "slash",
    kind: "wave",
    damage: 14,
    cooldown: 120,
    range: 500,
  },
  {
    id: "rocket",
    name: "Gum-Gum Rocket",
    anime: "One Piece",
    animation: "rush",
    kind: "grapple",
    damage: 16,
    cooldown: 140,
    range: 360,
  },
  {
    id: "dragonRoar",
    name: "Dragon Roar",
    anime: "Fairy Tail",
    animation: "beam",
    kind: "beam",
    damage: 18,
    cooldown: 160,
    range: 560,
  },
  {
    id: "blackFlash",
    name: "Black Flash",
    anime: "Jujutsu Kaisen",
    animation: "heavyPunch",
    kind: "critical",
    damage: 24,
    cooldown: 180,
    range: 100,
  },
  {
    id: "spiritGun",
    name: "Spirit Gun",
    anime: "Yu Yu Hakusho",
    animation: "beam",
    kind: "sniper",
    damage: 15,
    cooldown: 140,
    range: 700,
  },
  {
    id: "meteorFist",
    name: "Pegasus Meteor Fist",
    anime: "Saint Seiya",
    animation: "rush",
    kind: "meteor",
    damage: 19,
    cooldown: 170,
    range: 390,
  },
  {
    id: "godspeed",
    name: "Godspeed",
    anime: "Hunter x Hunter",
    animation: "rush",
    kind: "speed",
    damage: 13,
    cooldown: 200,
    range: 440,
  },
  {
    id: "fullCounter",
    name: "Full Counter",
    anime: "The Seven Deadly Sins",
    animation: "charge",
    kind: "counter",
    damage: 22,
    cooldown: 220,
    range: 180,
  },
  {
    id: "psychicCrush",
    name: "Psychic Crush",
    anime: "Mob Psycho 100",
    animation: "summon",
    kind: "pull",
    damage: 12,
    cooldown: 160,
    range: 330,
  },
  {
    id: "starBarrage",
    name: "Star Platinum Barrage",
    anime: "JoJo's Bizarre Adventure",
    animation: "punch",
    kind: "barrage",
    damage: 5,
    cooldown: 150,
    range: 105,
  },
  {
    id: "excalibur",
    name: "Excalibur",
    anime: "Fate/stay night",
    animation: "beam",
    kind: "ultimate",
    damage: 30,
    cooldown: 260,
    range: 680,
  },
];

const Sticker1 = forwardRef(function Sticker1(
  { state = "IDLE", power = null, airborne = false },
  ref,
) {
  return (
    <div
      ref={ref}
      className="sticker-fighter-instance sticker-one sticker-blue"
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
            <circle cx="54" cy="29" r="1.35" />
            <circle cx="54" cy="34" r="1.35" />
          </g>
          <path className="stick-line torso" d="M50 42 L50 82" />
          <path
            className="stick-line arm-back"
            d="M50 50 L35 68 L25 59"
            style={{
              transform: "rotate(var(--pose-arm-back, 0deg))",
              transformOrigin: "50px 50px",
            }}
          />
          <path
            className="stick-line arm-front"
            d="M50 52 L67 61 L79 48"
            style={{
              transform: "rotate(var(--pose-arm-front, 0deg))",
              transformOrigin: "50px 52px",
            }}
          />
          <path
            className="stick-line leg-back"
            d="M50 82 L37 111 L29 133"
            style={{
              transform: "rotate(var(--pose-leg-back, 0deg))",
              transformOrigin: "50px 82px",
            }}
          />
          <path
            className="stick-line leg-front"
            d="M50 82 L65 107 L78 127"
            style={{
              transform: "rotate(var(--pose-leg-front, 0deg))",
              transformOrigin: "50px 82px",
            }}
          />
          <circle className="stick-hand front-hand" cx="79" cy="48" r="3" />
          <path className="stick-foot" d="M29 133 L21 136" />
          <path className="stick-foot" d="M78 127 L85 129" />
        </g>
        <g className="hand-energy">
          <circle cx="79" cy="48" r="7" />
          <circle cx="79" cy="48" r="2.8" />
        </g>
        {/* Espada — forma original e simples (lâmina reta, guarda
            curta, pomo), presa ao mesmo giro do braço da frente pra
            acompanhar o movimento do golpe. Só aparece quando
            data-armado="true" (ver Stikers.css). */}
        <g
          className="arma-visual arma-espada"
          style={{
            transform: "rotate(var(--pose-arm-front, 0deg))",
            transformOrigin: "50px 52px",
          }}
        >
          <path className="arma-lamina" d="M79,48 L107,18" />
          <path className="arma-guarda" d="M73,54 L85,42" />
          <circle className="arma-pomo" cx="79" cy="48" r="2.2" />
        </g>
      </svg>
      <span className="runtime-name">BLUE</span>
    </div>
  );
});

export default Sticker1;