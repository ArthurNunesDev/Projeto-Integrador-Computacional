import { useEffect, useMemo, useState } from "react";

const CHAVE_MENSAGENS = "marketfaesa-mensagens";

const CONVERSAS_INICIAIS = [
  { id:"ana-souza", nome:"Ana Souza", curso:"Ciência da Computação", iniciais:"AS", online:true, naoLidas:2, mensagens:[
    {id:1,autor:"outro",texto:"Oi! Vi seu perfil e gostei das suas habilidades em React.",hora:"09:42"},
    {id:2,autor:"outro",texto:"Você teria disponibilidade para conversar sobre um projeto?",hora:"09:43"}]},
  { id:"lucas-martins", nome:"Lucas Martins", curso:"Design", iniciais:"LM", online:false, naoLidas:0, mensagens:[
    {id:1,autor:"eu",texto:"Ficou muito bom o material!",hora:"Ontem"},
    {id:2,autor:"outro",texto:"Obrigado! Se precisar de algo, pode me chamar.",hora:"Ontem"}]},
  { id:"marina-oliveira", nome:"Marina Oliveira", curso:"Administração", iniciais:"MO", online:true, naoLidas:1, mensagens:[
    {id:1,autor:"outro",texto:"Você ainda está procurando alguém para análise de dados?",hora:"Seg"}]},
  { id:"rafael-costa", nome:"Rafael Costa", curso:"Direito", iniciais:"RC", online:false, naoLidas:0, mensagens:[
    {id:1,autor:"eu",texto:"Podemos combinar de conversar amanhã.",hora:"Sex"}]}
];

function obterConversas() {
  try {
    const salvo = localStorage.getItem(CHAVE_MENSAGENS);
    if (salvo) {
      const conversas = JSON.parse(salvo);
      if (Array.isArray(conversas) && conversas.length) return conversas;
    }
  } catch {}
  return CONVERSAS_INICIAIS;
}

function Mensagens() {
  const [conversas,setConversas] = useState(obterConversas);
  const [selecionada,setSelecionada] = useState("ana-souza");
  const [busca,setBusca] = useState("");
  const [texto,setTexto] = useState("");
  const [mostrarLista,setMostrarLista] = useState(true);

  useEffect(() => localStorage.setItem(CHAVE_MENSAGENS,JSON.stringify(conversas)),[conversas]);

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
        <section className="mensagens-shell">
          <aside className={\`conversas-panel \${!mostrarLista?"mobile-escondido":""}\`}>
            <div className="conversas-header"><div><strong>Conversas</strong><span>{conversas.reduce((t,c)=>t+c.naoLidas,0)} não lidas</span></div></div>
            <label className="mensagens-busca"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conversa..." aria-label="Buscar conversa"/></label>
            <div className="conversas-lista">
              {filtradas.length ? filtradas.map(c=>{
                const ultima=c.mensagens[c.mensagens.length-1];
                return <button key={c.id} type="button" className={\`conversa-item \${c.id===atual.id?"selecionada":""}\`} onClick={()=>abrirConversa(c.id)}>
                  <span className="conversa-avatar">{c.iniciais}{c.online&&<i/>}</span>
                  <span className="conversa-dados"><span className="conversa-topo"><strong>{c.nome}</strong><small>{ultima?.hora}</small></span><span className="conversa-previa">{ultima?.texto||"Nova conversa"}</span></span>
                  {c.naoLidas>0&&<span className="conversa-nao-lidas">{c.naoLidas}</span>}
                </button>;
              }):<div className="conversas-sem-resultado"><span>⌕</span><strong>Nenhuma conversa encontrada</strong><p>Tente outro nome ou termo.</p></div>}
            </div>
          </aside>

          <section className={\`chat-panel \${mostrarLista?"":"mobile-visivel"}\`}>
            <header className="chat-header">
              <button className="chat-voltar" type="button" onClick={()=>setMostrarLista(true)} aria-label="Voltar para conversas">←</button>
              <div className="chat-pessoa-avatar">{atual.iniciais}{atual.online&&<i/>}</div>
              <div className="chat-pessoa-info"><strong>{atual.nome}</strong><span>{atual.online?"Online agora":atual.curso}</span></div>
              <button className="chat-acoes" type="button" aria-label="Mais opções">•••</button>
            </header>
            <div className="chat-conteudo"><div className="chat-data">HOJE</div><div className="chat-mensagens">
              {atual.mensagens.map(m=><div key={m.id} className={\`mensagem-linha \${m.autor==="eu"?"enviada":"recebida"}\`}><div className="mensagem-balao"><span>{m.texto}</span><small>{m.hora}</small></div></div>)}
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
