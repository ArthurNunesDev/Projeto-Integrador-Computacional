import { useEffect, useState } from "react";

import { listarNotificacoes, marcarLida, marcarTodas } from "../api/notificacoes.js";
import { destinoDaNotificacao, iconeDaNotificacao } from "../notificacoes.js";
import { mensagemDoErro } from "../useCarregar.js";
import { ConteudoNotificacao } from "./NotificationBell.jsx";

// Tamanho de cada página; se vier menos que isso, não há mais notificações.
export const LIMITE_PAGINA = 20;

const INICIAL = { itens: [], carregando: true, erro: "", temMais: false, carregandoMais: false, erroMais: "" };

/**
 * Página "notificacoes": todas as notificações, da mais nova para a mais antiga,
 * paginadas com "Carregar mais" (antesDeId = id da última exibida).
 * onAtualizar: pede ao App uma nova contagem de não lidas.
 */
function Notificacoes({ onNavigate, onAtualizar }) {
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [versao, setVersao] = useState(0);
  const [estado, setEstado] = useState(INICIAL);
  const [erroAcao, setErroAcao] = useState("");

  // Primeira página: ao abrir, ao trocar o filtro e ao tentar de novo.
  useEffect(() => {
    const controle = new AbortController();
    listarNotificacoes({ limite: LIMITE_PAGINA, naoLidas: soNaoLidas, signal: controle.signal }).then(
      (itens) => setEstado({ ...INICIAL, itens: itens ?? [], carregando: false, temMais: (itens ?? []).length === LIMITE_PAGINA }),
      (erro) => {
        if (!controle.signal.aborted) setEstado({ ...INICIAL, carregando: false, erro: mensagemDoErro(erro) });
      },
    );
    return () => controle.abort();
  }, [soNaoLidas, versao]);

  function recomecar() {
    setEstado(INICIAL);
    setErroAcao("");
  }

  function alterarFiltro(event) {
    recomecar();
    setSoNaoLidas(event.target.checked);
  }

  function tentarDeNovo() {
    recomecar();
    setVersao((v) => v + 1);
  }

  async function carregarMais() {
    const antesDeId = estado.itens.at(-1)?.id;
    const filtro = soNaoLidas;
    setEstado((atual) => ({ ...atual, carregandoMais: true, erroMais: "" }));
    try {
      const proximas = (await listarNotificacoes({ limite: LIMITE_PAGINA, antesDeId, naoLidas: filtro })) ?? [];
      setEstado((atual) => {
        // Descarta se o filtro mudou ou a lista recomeçou enquanto carregava.
        if (atual.itens.at(-1)?.id !== antesDeId) return atual;
        return { ...atual, itens: [...atual.itens, ...proximas], temMais: proximas.length === LIMITE_PAGINA, carregandoMais: false };
      });
    } catch (erro) {
      setEstado((atual) => ({ ...atual, carregandoMais: false, erroMais: mensagemDoErro(erro) }));
    }
  }

  function abrirNotificacao(item) {
    if (!item.lida) {
      setEstado((atual) => ({ ...atual, itens: atual.itens.map((n) => (n.id === item.id ? { ...n, lida: true } : n)) }));
      marcarLida(item.id).catch(() => {}).finally(() => onAtualizar?.());
    }
    const destino = destinoDaNotificacao(item.tipo);
    if (destino) onNavigate?.(destino);
  }

  async function marcarTodasComoLidas() {
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

  const { itens, carregando, erro, temMais, carregandoMais, erroMais } = estado;
  const naoLidasExibidas = itens.filter((n) => !n.lida).length;

  let conteudo;
  if (carregando) {
    conteudo = <p className="notificacoes-estado" role="status">Carregando notificações...</p>;
  } else if (erro) {
    conteudo = (
      <section className="notificacoes-estado" role="alert">
        <h2>Não foi possível carregar as notificações</h2>
        <p>{erro}</p>
        <button type="button" className="notificacoes-botao" onClick={tentarDeNovo}>Tentar novamente</button>
      </section>
    );
  } else if (itens.length === 0) {
    conteudo = (
      <section className="notificacoes-estado">
        <h2>{soNaoLidas ? "Nenhuma notificação não lida" : "Nenhuma notificação por enquanto"}</h2>
        <p>Pedidos de conexão, candidaturas e mudanças nas suas oportunidades aparecem aqui.</p>
      </section>
    );
  } else {
    conteudo = (
      <>
        <ul className="notificacoes-lista">
          {itens.map((item) => (
            <li key={item.id}>
              <button type="button" className={`notificacao-item ${item.lida ? "" : "nao-lida"}`} onClick={() => abrirNotificacao(item)}>
                <span className="notificacao-item__icone" aria-hidden="true">{iconeDaNotificacao(item.tipo)}</span>
                <span className="notificacao-item__texto"><ConteudoNotificacao item={item} /></span>
                {!item.lida && <span className="notificacao-item__ponto" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
        {erroMais && <p className="notificacoes-erro" role="alert">Não foi possível carregar mais. {erroMais}</p>}
        {temMais && (
          <button type="button" className="notificacoes-botao notificacoes-mais" onClick={carregarMais} disabled={carregandoMais}>
            {carregandoMais ? "Carregando..." : "Carregar mais"}
          </button>
        )}
      </>
    );
  }

  return (
    <main className="notificacoes-page">
      <div className="notificacoes-container">
        <header className="notificacoes-header">
          <div>
            <span>ATIVIDADE</span>
            <h1>Notificações</h1>
            <p>Acompanhe pedidos de conexão, candidaturas e mudanças nas oportunidades.</p>
          </div>
          <button type="button" className="page-back-button" onClick={() => onNavigate?.("inicio")}>← Voltar ao início</button>
        </header>

        <section className="notificacoes-toolbar" aria-label="Filtros e ações">
          <label className="notificacoes-filtro">
            <input type="checkbox" checked={soNaoLidas} onChange={alterarFiltro} />
            <span>Só não lidas</span>
          </label>
          <button type="button" className="notificacoes-botao" onClick={marcarTodasComoLidas} disabled={carregando || naoLidasExibidas === 0}>
            Marcar todas como lidas
          </button>
        </section>

        {erroAcao && <p className="notificacoes-erro" role="alert">{erroAcao}</p>}
        {conteudo}
      </div>
    </main>
  );
}

export default Notificacoes;
