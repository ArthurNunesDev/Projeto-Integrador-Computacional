import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const EVENTOS_DE_INTERACAO = ["pointerdown", "keydown"];

/**
 * Roda tarefa(signal) agora e de novo `intervalo` ms depois que cada execução terminar
 * (setTimeout encadeado: nunca há duas execuções ao mesmo tempo).
 *
 * - Com a aba oculta (document.hidden) não agenda nada; ao voltar a ficar visível, roda na hora.
 * - Com `inatividade` (ms), pausa quando passa esse tempo sem pointerdown/keydown e retoma
 *   na hora na próxima interação.
 * - A tarefa pode devolver um número (ms até a próxima execução, ex.: backoff) ou false (para
 *   de vez). Qualquer outro valor usa `intervalo`. Exceções da tarefa são tratadas como undefined.
 * - Trocar `chave` (ex.: o id da conversa aberta) reinicia o ciclo com uma execução imediata.
 * - Ao desmontar (ou com ativo = false) cancela o timer e aborta o signal da execução em curso.
 *
 * Devolve executarAgora(): roda na hora; se já houver uma execução em curso, roda logo depois dela.
 */
export function useIntervaloVisivel(tarefa, intervalo, { ativo = true, inatividade = null, chave } = {}) {
  const tarefaRef = useRef(tarefa);
  const executarAgoraRef = useRef(null);

  useLayoutEffect(() => {
    tarefaRef.current = tarefa;
  });

  useEffect(() => {
    if (!ativo) return undefined;

    const controle = new AbortController();
    let timer = null;
    let emAndamento = false;
    let pendente = false;
    let parado = false;
    let ocioso = false;
    let ultimaInteracao = Date.now();

    function pausado() {
      return controle.signal.aborted || parado || ocioso || document.hidden;
    }

    function agendar(espera) {
      window.clearTimeout(timer);
      timer = null;
      if (pausado()) return;
      timer = window.setTimeout(executar, espera);
    }

    async function executar() {
      window.clearTimeout(timer);
      timer = null;
      if (emAndamento) {
        pendente = true;
        return;
      }
      if (inatividade != null && Date.now() - ultimaInteracao >= inatividade) ocioso = true;
      if (pausado()) return;

      emAndamento = true;
      let resultado;
      try {
        resultado = await tarefaRef.current(controle.signal);
      } catch {
        resultado = undefined;
      }
      emAndamento = false;
      if (controle.signal.aborted) return;
      if (resultado === false) {
        parado = true;
        return;
      }
      if (pendente) {
        pendente = false;
        agendar(0);
        return;
      }
      agendar(typeof resultado === "number" ? resultado : intervalo);
    }

    function aoMudarVisibilidade() {
      if (document.hidden) {
        window.clearTimeout(timer);
        timer = null;
      } else {
        executar();
      }
    }

    function aoInteragir() {
      ultimaInteracao = Date.now();
      if (!ocioso) return;
      ocioso = false;
      executar();
    }

    executarAgoraRef.current = executar;
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    if (inatividade != null) {
      EVENTOS_DE_INTERACAO.forEach((evento) => window.addEventListener(evento, aoInteragir, true));
    }
    executar();

    return () => {
      controle.abort();
      window.clearTimeout(timer);
      if (executarAgoraRef.current === executar) executarAgoraRef.current = null;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      EVENTOS_DE_INTERACAO.forEach((evento) => window.removeEventListener(evento, aoInteragir, true));
    };
  }, [ativo, intervalo, inatividade, chave]);

  return useCallback(() => {
    executarAgoraRef.current?.();
  }, []);
}
