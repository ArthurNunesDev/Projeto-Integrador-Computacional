import { useEffect, useMemo, useState } from "react";
import { chaveUsuario, lerValorSeguro, salvarValorSeguro } from "../storage.js";

const CHAVE_MENSAGENS = "marketfaesa-mensagens";

const CONVERSAS_DEMONSTRACAO = [
  {
    id: "ana-souza", nome: "Ana Souza", curso: "Ciência da Computação", iniciais: "AS", online: true, naoLidas: 2,
    mensagens: [
      { id: "ana-1", autor: "outra", texto: "Oi! Vi seu perfil na MarketFAESA e gostei da sua experiência com desenvolvimento web.", hora: "09:12" },
      { id: "ana-2", autor: "eu", texto: "Oi, Ana! Obrigado 😊 Também estou procurando pessoas para trocar ideias e colaborar em projetos.", hora: "09:14" },
      { id: "ana-3", autor: "outra", texto: "Que legal! Estou montando uma ideia de plataforma para ajudar estudantes a encontrar grupos de estudo.", hora: "09:16" },
      { id: "ana-4", autor: "outra", texto: "Você teria um tempinho esta semana para conversarmos sobre a parte do front-end?", hora: "09:17" },
    ],
  },
  {
    id: "lucas-martins", nome: "Lucas Martins", curso: "Design", iniciais: "LM", online: true, naoLidas: 1,
    mensagens: [
      { id: "lucas-1", autor: "outra", texto: "Olá! Estou trabalhando em um conceito visual para um projeto acadêmico.", hora: "Ontem" },
      { id: "lucas-2", autor: "eu", texto: "Oi, Lucas! Que tipo de projeto?", hora: "Ontem" },
      { id: "lucas-3", autor: "outra", texto: "Um app para conectar alunos que querem colaborar em projetos. Você toparia trocar referências de UI?", hora: "10:42" },
    ],
  },
  {
    id: "mariana-costa", nome: "Mariana Costa", curso: "Administração", iniciais: "MC", online: false, naoLidas: 0,
    mensagens: [
      { id: "mariana-1", autor: "outra", texto: "Obrigada por participar da conversa sobre o projeto!", hora: "Ontem" },
      { id: "mariana-2", autor: "eu", texto: "Eu que agradeço! Acho que podemos organizar as próximas etapas por aqui.", hora: "Ontem" },
      { id: "mariana-3", autor: "outra", texto: "Perfeito. Vou compartilhar uma primeira lista de tarefas quando estiver pronta.", hora: "Seg" },
    ],
  },
  {
    id: "rafael-lima", nome: "Rafael Lima", curso: "Engenharia", iniciais: "RL", online: false, naoLidas: 0,
    mensagens: [
      { id: "rafael-1", autor: "outra", texto: "Oi! Vi que você tem interesse em tecnologia. Estamos formando uma equipe para um hackathon universitário.", hora: "Seg" },
      { id: "rafael-2", autor: "eu", texto: "Tenho interesse sim! Já tem uma ideia definida?", hora: "Seg" },
      { id: "rafael-3", autor: "outra", texto: "Estamos entre duas ideias. Te mando os detalhes em breve.", hora: "Seg" },
    ],
  },
];


function obterConversas(chave) {
  try {
    const salvo = lerValorSeguro(chave);
    if (salvo) {
      const conversas = JSON.parse(salvo);
      if (Array.isArray(conversas) && conversas.length) return conversas;
    }
  } catch {
    // localStorage indisponível ou com JSON inválido: começa sem conversas
  }
  return CONVERSAS_DEMONSTRACAO.map((conversa) => ({ ...conversa, mensagens: conversa.mensagens.map((mensagem) => ({ ...mensagem })) }));
}

function Mensagens({ usuarioId }) {
  const chaveMensagens = chaveUsuario(CHAVE_MENSAGENS, usuarioId);
  const [conversas,setConversas] = useState(() => obterConversas(chaveMensagens));
  const [selecionada,setSelecionada] = useState("ana-souza");
  const [busca,setBusca] = useState("");
  const [texto,setTexto] = useState("");
  const [mostrarLista,setMostrarLista] = useState(true);

  useEffect(() => {
    salvarValorSeguro(chaveMensagens, JSON.stringify(conversas));
  }, [chaveMensagens, conversas]);

  const filtradas = useMemo(() => {
    const termo=busca.trim().toLowerCase();
    if(!termo) return conversas;
    return conversas.filter(c => c.nome.toLowerCase().includes(termo) || c.curso.toLowerCase().includes(termo) || c.mensagens.some(m => m.texto.toLowerCase().includes(termo)));
  },[busca,conversas]);

  const atual=conversas.find(c=>c.id===selecionada)||conversas[0];

  function abrirConversa(id) {
    setSelecionada(id); setTexto(""); setMostrarLista(false);
    setConversas(lista=>lista.map(c=>c.id===id?{...c,naoLidas:0}:c));
  }

  function enviar(event) {
    event.preventDefault();
    const mensagem=texto.trim();
    if(!mensagem||!atual)return;
    const hora=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    setConversas(lista=>lista.map(c=>c.id===atual.id?{...c,mensagens:[...c.mensagens,{id:Date.now(),autor:"eu",texto:mensagem,hora}]}:c));
    setTexto("");
  }

  if(!atual) return <main className="mensagens-page"><div className="mensagens-vazio-geral"><span className="mensagens-vazio-icon">□</span><h1>Nenhuma conversa</h1><p>Quando você iniciar uma conversa, ela aparecerá aqui.</p></div></main>;

  return (
    <main className="mensagens-page">
      <div className="mensagens-container">
        <div className="mensagens-heading">
          <div><span className="mensagens-eyebrow">COMUNICAÇÃO</span><h1>Mensagens</h1><p>Converse com pessoas da comunidade FAESA e acompanhe seus projetos.</p></div>
          <div className="mensagens-total"><strong>{conversas.length}</strong><span>conversas</span></div>
        </div>
        <div className="mensagens-demo-aviso"><span aria-hidden="true">✦</span><div><strong>Modo demonstração</strong><p>Estas conversas são fictícias. As mensagens enviadas ficam salvas apenas neste navegador e não são entregues a outras pessoas.</p></div></div>
        <section className="mensagens-shell">
          <aside className={`conversas-panel ${!mostrarLista?"mobile-escondido":""}`}>
            <div className="conversas-header"><div><strong>Conversas</strong><span>{conversas.reduce((t,c)=>t+c.naoLidas,0)} não lidas</span></div></div>
            <label className="mensagens-busca"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conversa..." aria-label="Buscar conversa"/></label>
            <div className="conversas-lista">
              {filtradas.length ? filtradas.map(c=>{
                const ultima=c.mensagens[c.mensagens.length-1];
                return <button key={c.id} type="button" className={`conversa-item ${c.id===atual.id?"selecionada":""}`} onClick={()=>abrirConversa(c.id)}>
                  <span className="conversa-avatar">{c.iniciais}{c.online&&<i/>}</span>
                  <span className="conversa-dados"><span className="conversa-topo"><strong>{c.nome}</strong><small>{ultima?.hora}</small></span><span className="conversa-previa">{ultima?.texto||"Nova conversa"}</span></span>
                  {c.naoLidas>0&&<span className="conversa-nao-lidas">{c.naoLidas}</span>}
                </button>;
              }):<div className="conversas-sem-resultado"><span>⌕</span><strong>Nenhuma conversa encontrada</strong><p>Tente outro nome ou termo.</p></div>}
            </div>
          </aside>

          <section className={`chat-panel ${mostrarLista?"":"mobile-visivel"}`}>
            <header className="chat-header">
              <button className="page-back-button chat-voltar" type="button" onClick={()=>setMostrarLista(true)} aria-label="Voltar para conversas">←</button>
              <div className="chat-pessoa-avatar">{atual.iniciais}{atual.online&&<i/>}</div>
              <div className="chat-pessoa-info"><strong>{atual.nome}</strong><span>{atual.online?"Online agora":atual.curso}</span></div>
              <button className="chat-acoes" type="button" aria-label="Mais opções">•••</button>
            </header>
            <div className="chat-conteudo"><div className="chat-data">CONVERSA DE DEMONSTRAÇÃO</div><div className="chat-mensagens">
              {atual.mensagens.map(m=><div key={m.id} className={`mensagem-linha ${m.autor==="eu"?"enviada":"recebida"}`}><div className="mensagem-balao"><span>{m.texto}</span><small>{m.hora}</small></div></div>)}
            </div></div>
            <form className="chat-compositor" onSubmit={enviar}>
              <button className="chat-anexo" type="button" aria-label="Anexar arquivo">+</button>
              <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Digite uma mensagem..." autoComplete="off"/>
              <button className="chat-enviar" type="submit" disabled={!texto.trim()} aria-label="Enviar mensagem">→</button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

export default Mensagens;
