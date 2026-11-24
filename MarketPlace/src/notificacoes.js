// Regras de exibição das notificações, usadas pelo sino do cabeçalho e pela página.

// Página do App aberta ao clicar numa notificação, pelo prefixo do tipo.
const DESTINOS = [
  ["CONEXAO_", "conexoes"],
  ["PARTICIPACAO_", "oportunidades"],
  ["OPORTUNIDADE_", "oportunidades"],
];

export function destinoDaNotificacao(tipo = "") {
  return DESTINOS.find(([prefixo]) => tipo.startsWith(prefixo))?.[1] ?? null;
}

const ICONES = { CONEXAO: "♡", PARTICIPACAO: "✦", OPORTUNIDADE: "□" };

export function iconeDaNotificacao(tipo = "") {
  return ICONES[tipo.split("_")[0]] ?? "•";
}

/** "agora", "há 5 min", "há 2 h", "há 3 dias" ou a data, para o horário da notificação. */
export function formatarQuando(iso, agora = Date.now()) {
  if (!iso) return "";
  const data = new Date(iso);
  const minutos = Math.floor((agora - data.getTime()) / 60_000);
  if (Number.isNaN(minutos)) return "";
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Texto do badge: até 99, depois "99+". */
export function textoDoBadge(total) {
  return total > 99 ? "99+" : String(total);
}

/** "nenhuma não lida", "1 não lida", "5 não lidas". */
export function descreverNaoLidas(total) {
  if (!total) return "nenhuma não lida";
  return total === 1 ? "1 não lida" : `${total} não lidas`;
}
