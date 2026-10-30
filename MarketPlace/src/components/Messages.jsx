import { useEffect, useMemo, useState } from "react";
import { enviarMensagem, listarConversas, listarMensagens } from "../api/conversas.js";
import { iniciais } from "../rotulos.js";
import { mensagemDoErro, useCarregar } from "../useCarregar.js";

// A API não tem tempo real: com uma conversa aberta, mensagens e lista são recarregadas neste intervalo.
export const INTERVALO_ATUALIZACAO = 5000;

function formatarHora(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  return data.toDateString() === new Date().toDateString()
    ? data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Mensagens({ conversaInicial = null }) {
  const { dados: conversas, carregando, erro, recarregar, setDados: setConversas } = useCarregar(listarConversas, []);
  const [selecionada,setSelecionada] = useState(conversaInicial);
  // Mensagens da conversa aberta; guardam o id para não mostrar as de outra conversa enquanto carrega.
  const [mensagens,setMensagens] = useState({ conversaId: null, lista: [] });
  const [busca,setBusca] = useState("");
  const [texto,setTexto] = useState("");
  const [mostrarLista,setMostrarLista] = useState(!conversaInicial);
  const [enviando,setEnviando] = useState(false);
  const [erroPersistencia,setErroPersistencia] = useState("");

  const filtradas = useMemo(() => {
    const termo=busca.trim().toLowerCase();
    if(!termo) return conversas;
    return conversas.filter(c => c.pessoa.nome.toLowerCase().includes(termo) || (c.pessoa.curso?.nome||"").toLowerCase().includes(termo) || (c.ultimaMensagem?.texto||"").toLowerCase().includes(termo));
  },[busca,conversas]);

  const atual=conversas.find(c=>c.id===selecionada)||conversas[0];
  const atualId=atual?.id;

  useEffect(() => {
    if (!atualId) return undefined;
    let ativo = true;
    async function atualizar() {
      try {
        // Primeiro as mensagens (o GET marca como lidas), depois a lista com as não lidas atualizadas.
        const lista = await listarMensagens(atualId);
        if (!ativo) return;
        setMensagens({ conversaId: atualId, lista });
        const novasConversas = await listarConversas();
        if (ativo) setConversas(novasConversas);
      } catch (e) {
        if (ativo) setErroPersistencia(mensagemDoErro(e));
      }
    }
    atualizar();
    const timer = window.setInterval(atualizar, INTERVALO_ATUALIZACAO);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
  }, [atualId, setConversas]);

  function abrirConversa(id) {
    setSelecionada(id);
    setTexto("");
    setErroPersistencia("");
    setMostrarLista(false);
  }

  async function enviar(event) {
    event.preventDefault();
    const mensagem=texto.trim();
    if(!mensagem||!atual||enviando)return;
    setEnviando(true);
    try {
      const nova = await enviarMensagem(atual.id, mensagem);
      setMensagens((estado) => estado.conversaId === atual.id ? { ...estado, lista: [...estado.lista, nova] } : estado);
      setConversas((lista) => lista.map((c) => c.id === atual.id ? { ...c, ultimaMensagem: nova, atualizadoEm: nova.criadoEm } : c));
      setTexto("");
      setErroPersistencia("");
    } catch (e) {
      setErroPersistencia(mensagemDoErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if(carregando) return <main className="mensagens-page"><div className="mensagens-vazio-geral" role="status"><span className="mensagens-vazio-icon">□</span><h1>Carregando conversas...</h1></div></main>;
  if(erro) return <main className="mensagens-page"><div className="mensagens-vazio-geral" role="alert"><span className="mensagens-vazio-icon">!</span><h1>Não foi possível carregar as conversas</h1><p>{erro}</p><button type="button" className="chat-enviar" onClick={recarregar} aria-label="Tentar novamente">↻</button></div></main>;
  if(!atual) return <main className="mensagens-page"><div className="mensagens-vazio-geral"><span className="mensagens-vazio-icon">□</span><h1>Nenhuma conversa</h1><p>Abra o perfil de alguém em Conexões ou Habilidades e toque em "Mensagem" para começar.</p></div></main>;

  return (
    <main className="mensagens-page">
      <div className="mensagens-container">
        <div className="mensagens-heading">
          <div><span className="mensagens-eyebrow">COMUNICAÇÃO</span><h1>Mensagens</h1><p>Converse com pessoas da comunidade FAESA e acompanhe seus projetos.</p></div>
          <div className="mensagens-total"><strong>{conversas.length}</strong><span>conversas</span></div>
        </div>
        {erroPersistencia && <p className="mensagens-persistence-error" role="alert">{erroPersistencia}</p>}
        <section className="mensagens-shell">
          <aside className={`conversas-panel ${!mostrarLista?"mobile-escondido":""}`}>
            <div className="conversas-header"><div><strong>Conversas</strong><span>{conversas.reduce((t,c)=>t+c.naoLidas,0)} não lidas</span></div></div>
            <label className="mensagens-busca"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conversa..." aria-label="Buscar conversa"/></label>
            <div className="conversas-lista">
              {filtradas.length ? filtradas.map(c=>{
                const ultima=c.ultimaMensagem;
                return <button key={c.id} type="button" className={`conversa-item ${c.id===atual.id?"selecionada":""}`} onClick={()=>abrirConversa(c.id)}>
                  <span className="conversa-avatar">{iniciais(c.pessoa.nome)}</span>
                  <span className="conversa-dados"><span className="conversa-topo"><strong>{c.pessoa.nome}</strong><small>{formatarHora(ultima?.criadoEm)}</small></span><span className="conversa-previa">{ultima?.texto||"Nova conversa"}</span></span>
                  {c.naoLidas>0&&<span className="conversa-nao-lidas">{c.naoLidas}</span>}
                </button>;
              }):<div className="conversas-sem-resultado"><span>⌕</span><strong>Nenhuma conversa encontrada</strong><p>Tente outro nome ou termo.</p></div>}
            </div>
          </aside>

          <section className={`chat-panel ${mostrarLista?"":"mobile-visivel"}`}>
            <header className="chat-header">
              <button className="page-back-button chat-voltar" type="button" onClick={()=>setMostrarLista(true)} aria-label="Voltar para conversas">←</button>
              <div className="chat-pessoa-avatar">{iniciais(atual.pessoa.nome)}</div>
              <div className="chat-pessoa-info"><strong>{atual.pessoa.nome}</strong><span>{atual.pessoa.curso?.nome||""}</span></div>
              <button className="chat-acoes" type="button" aria-label="Mais opções">•••</button>
            </header>
            <div className="chat-conteudo"><div className="chat-data">{mensagens.conversaId===atual.id?(mensagens.lista.length?"CONVERSA":"NENHUMA MENSAGEM AINDA"):"CARREGANDO..."}</div><div className="chat-mensagens">
              {mensagens.conversaId===atual.id&&mensagens.lista.map(m=><div key={m.id} className={`mensagem-linha ${m.minha?"enviada":"recebida"}`}><div className="mensagem-balao"><span>{m.texto}</span><small>{formatarHora(m.criadoEm)}</small></div></div>)}
            </div></div>
            <form className="chat-compositor" onSubmit={enviar}>
              <button className="chat-anexo" type="button" aria-label="Anexar arquivo">+</button>
              <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Digite uma mensagem..." autoComplete="off" maxLength={2000}/>
              <button className="chat-enviar" type="submit" disabled={!texto.trim()||enviando} aria-label="Enviar mensagem">→</button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

export default Mensagens;
