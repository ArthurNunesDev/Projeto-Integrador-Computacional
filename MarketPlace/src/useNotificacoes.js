import { useCallback, useRef, useState } from "react";

import { obterContagem } from "./api/notificacoes.js";
import { useIntervaloVisivel } from "./useIntervaloVisivel.js";

// A API não tem tempo real: a contagem de não lidas é consultada neste intervalo.
export const INTERVALO_NOTIFICACOES = 30_000;
// Depois de uma falha, espera 60 s e dobra a cada nova falha, até 5 min.
export const ESPERA_APOS_FALHA = 60_000;
export const ESPERA_MAXIMA = 300_000;
// Sem pointerdown/keydown por 10 min, a consulta pausa até a próxima interação.
export const TEMPO_INATIVIDADE = 600_000;

const SEM_NOTIFICACOES = { naoLidas: 0, mensagensNaoLidas: 0 };

export function esperaAposFalhas(falhas) {
  return Math.min(ESPERA_APOS_FALHA * 2 ** (falhas - 1), ESPERA_MAXIMA);
}

/**
 * Contagem de notificações e mensagens não lidas do usuário logado (usuarioId; null = sem sessão).
 * Montado uma vez no App. recarregar() busca na hora (ex.: depois de marcar como lida);
 * se já houver uma busca em curso, busca de novo quando ela terminar.
 * Um 401 para a consulta: o client já avisa o App, que encerra a sessão.
 */
export function useNotificacoes(usuarioId) {
  // Guarda de quem é a contagem: ao trocar de conta, a anterior não aparece nem por um instante.
  const [contagem, setContagem] = useState({ usuarioId: null, ...SEM_NOTIFICACOES });
  // Falhas seguidas da conta atual (para o backoff).
  const falhasRef = useRef({ usuarioId: null, total: 0 });

  const consultar = useCallback(
    async (signal) => {
      try {
        const resposta = await obterContagem({ signal });
        if (signal.aborted) return false;
        falhasRef.current = { usuarioId, total: 0 };
        setContagem({
          usuarioId,
          naoLidas: resposta?.naoLidas ?? 0,
          mensagensNaoLidas: resposta?.mensagensNaoLidas ?? 0,
        });
        return INTERVALO_NOTIFICACOES;
      } catch (erro) {
        if (signal.aborted || erro?.name === "AbortError" || erro?.status === 401) return false;
        const anteriores = falhasRef.current.usuarioId === usuarioId ? falhasRef.current.total : 0;
        falhasRef.current = { usuarioId, total: anteriores + 1 };
        return esperaAposFalhas(anteriores + 1);
      }
    },
    [usuarioId],
  );

  const recarregar = useIntervaloVisivel(consultar, INTERVALO_NOTIFICACOES, {
    ativo: usuarioId != null,
    inatividade: TEMPO_INATIVIDADE,
    chave: usuarioId,
  });

  const atual = usuarioId != null && contagem.usuarioId === usuarioId ? contagem : SEM_NOTIFICACOES;
  return { naoLidas: atual.naoLidas, mensagensNaoLidas: atual.mensagensNaoLidas, recarregar };
}
