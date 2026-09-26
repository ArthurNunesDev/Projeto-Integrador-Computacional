/* =========================================================
   COOLDOWNS — cada habilidade tem seu próprio tempo de recarga,
   independente das outras.

   Antes, usar QUALQUER golpe (fosse um soco básico ou o golpe
   mais forte do repertório) bloqueava TODOS os golpes pelo mesmo
   tempo — um único `f.cooldown` compartilhado. Isso é o motivo
   pelo qual dava pra usar Rasengan, esperar, usar Excalibur,
   esperar — mas nunca dar um soco simples enquanto uma habilidade
   grande ainda estava recarregando.

   Agora cada golpe tem um `id` e cada lutador guarda um mapa
   `cooldowns: { [id]: prontoEmMs }`. Isso é o que permite: socos
   básicos quase sempre disponíveis, uma habilidade nomeada
   recarregando havia alguns segundos, e a arma citando sozinha.
   ========================================================= */

export function podeUsar(fighter, id, now) {
  const prontoEm = fighter.cooldowns[id] || 0;
  return now >= prontoEm;
}

export function marcarUso(fighter, id, now, duracaoMs) {
  fighter.cooldowns[id] = now + duracaoMs;
}

/* Entre uma lista de golpes, devolve um aleatório que já esteja
   fora do próprio cooldown — ou null se nenhum estiver pronto. */
export function escolherPronto(fighter, golpes, now) {
  const prontos = golpes.filter((g) => podeUsar(fighter, g.id, now));
  if (prontos.length === 0) return null;
  return prontos[Math.floor(Math.random() * prontos.length)];
}
