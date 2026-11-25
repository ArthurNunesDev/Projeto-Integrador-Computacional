import { useEffect, useId, useRef, useState } from "react";

import { listarNotificacoes, marcarLida, marcarTodas } from "../api/notificacoes.js";
import {
  descreverNaoLidas, destinoDaNotificacao, formatarQuando, iconeDaNotificacao, textoDoBadge,
} from "../notificacoes.js";
import { mensagemDoErro } from "../useCarregar.js";

// Quantas notificações o menu do sino mostra; o resto fica na página "notificacoes".
export const LIMITE_SINO = 10;

/**
 * Sino do cabeçalho: badge com as não lidas e um painel com as últimas notificações.
 * onAtualizar: pede ao App uma nova contagem depois de marcar como lida.
 */
function NotificationBell({ naoLidas = 0, onNavigate, onAtualizar }) {
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState({ itens: [], carregando: false, erro: "" });
  const [erroAcao, setErroAcao] = useState("");
  const [versao, setVersao] = useState(0);
  const wrapperRef = useRef(null);
  const botaoRef = useRef(null);
  const painelId = useId();
  const tituloId = useId();

  // Busca as últimas sempre que o painel abre (ou ao tentar de novo).
  useEffect(() => {
    if (!aberto) return undefined;
    const controle = new AbortController();
    listarNotificacoes({ limite: LIMITE_SINO, signal: controle.signal }).then(
      (itens) => setEstado({ itens: itens ?? [], carregando: false, erro: "" }),
      (erro) => {
        if (!controle.signal.aborted) setEstado((atual) => ({ ...atual, carregando: false, erro: mensagemDoErro(erro) }));
      },
    );
    return () => controle.abort();
  }, [aberto, versao]);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicarFora(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setAberto(false);
    }
    function aoTeclar(event) {
      if (event.key !== "Escape") return;
      setAberto(false);
      botaoRef.current?.focus();
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function alternar() {
    if (!aberto) {
      setEstado((atual) => ({ ...atual, carregando: true, erro: "" }));
      setErroAcao("");
    }
    setAberto(!aberto);
  }

  function tentarDeNovo() {
    setEstado((atual) => ({ ...atual, carregando: true, erro: "" }));
    setVersao((v) => v + 1);
  }

  function abrirNotificacao(item) {
    setAberto(false);
    if (!item.lida) {
      setEstado((atual) => ({ ...atual, itens: atual.itens.map((n) => (n.id === item.id ? { ...n, lida: true } : n)) }));
      // Navega mesmo se o PUT falhar: a notificação volta como não lida na próxima consulta.
      marcarLida(item.id).catch(() => {}).finally(() => onAtualizar?.());
    }
    const destino = destinoDaNotificacao(item.tipo);
    if (destino) onNavigate?.(destino);
  }

  async function marcarTodasComoLidas() {
    // Só até a mais nova exibida: o que chegou depois continua não lido.
    const ateId = Math.max(...estado.itens.map((n) => n.id));
    setErroAcao("");
    try {
      await marcarTodas(ateId);
      setEstado((atual) => ({ ...atual, itens: atual.itens.map((n) => (n.id <= ateId ? { ...n, lida: true } : n)) }));
      onAtualizar?.();
    } catch (erro) {
      setErroAcao(`Não foi possível marcar como lidas. ${mensagemDoErro(erro)}`);
    }
  }

  function verTodas() {
    setAberto(false);
    onNavigate?.("notificacoes");
  }

  const { itens, carregando, erro } = estado;
  const temNaoLidaExibida = itens.some((n) => !n.lida);

  return (
    <div className="notificacoes-sino" ref={wrapperRef}>
      <button
        ref={botaoRef}
        className={`notificacoes-sino__botao ${aberto ? "ativo" : ""}`}
        type="button"
        aria-label={`Notificações, ${descreverNaoLidas(naoLidas)}`}
        aria-expanded={aberto}
        aria-controls={aberto ? painelId : undefined}
        onClick={alternar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15L6 17Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {naoLidas > 0 && <span className="notificacoes-sino__badge" aria-hidden="true">{textoDoBadge(naoLidas)}</span>}
      </button>

      {aberto && (
        <section id={painelId} className="notificacoes-sino__painel" aria-labelledby={tituloId}>
          <header className="notificacoes-sino__topo">
            <h2 id={tituloId}>Notificações</h2>
            <button type="button" className="notificacoes-sino__link" onClick={marcarTodasComoLidas} disabled={carregando || !temNaoLidaExibida}>
              Marcar todas como lidas
            </button>
          </header>

          {erroAcao && <p className="notificacoes-sino__erro" role="alert">{erroAcao}</p>}

          {carregando ? (
            <p className="notificacoes-sino__estado" role="status">Carregando notificações...</p>
          ) : erro ? (
            <div className="notificacoes-sino__estado" role="alert">
              <p>Não foi possível carregar as notificações. {erro}</p>
              <button type="button" className="notificacoes-sino__link" onClick={tentarDeNovo}>Tentar novamente</button>
            </div>
          ) : itens.length === 0 ? (
            <p className="notificacoes-sino__estado">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="notificacoes-sino__lista">
              {itens.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notificacao-item ${item.lida ? "" : "nao-lida"}`}
                    onClick={() => abrirNotificacao(item)}
                  >
                    <span className="notificacao-item__icone" aria-hidden="true">{iconeDaNotificacao(item.tipo)}</span>
                    <span className="notificacao-item__texto">
                      <ConteudoNotificacao item={item} />
                    </span>
                    {!item.lida && <span className="notificacao-item__ponto" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="notificacoes-sino__rodape">
            <button type="button" className="notificacoes-sino__link" onClick={verTodas}>Ver todas</button>
          </footer>
        </section>
      )}
    </div>
  );
}

/** Texto, horário e "Não lida" para leitores de tela; usado também pela página de notificações. */
export function ConteudoNotificacao({ item }) {
  return (
    <>
      {!item.lida && <span className="visualmente-oculto">Não lida:</span>}{" "}
      <span>{item.texto}</span>{" "}
      <small>{formatarQuando(item.criadoEm)}</small>
    </>
  );
}

export default NotificationBell;
