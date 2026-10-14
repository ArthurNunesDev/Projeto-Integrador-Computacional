import { useEffect, useMemo, useState } from "react";
import "./Opportunities.scss";

const dados = [
  { id:1, icon:"💻", tipo:"PROJETO", titulo:"Desenvolvimento de App para Clínica", area:"Tecnologia", modalidade:"Remoto", pessoa:"Maria Lima", curso:"Medicina", inicial:"ML", descricao:"Apoio na criação de um aplicativo para organização de atendimentos." },
  { id:2, icon:"⚖️", tipo:"CONSULTORIA", titulo:"Revisão Jurídica de Contratos Digitais", area:"Direito", modalidade:"Híbrido", pessoa:"Rafael Costa", curso:"Direito", inicial:"RC", descricao:"Revisão e organização de contratos para um projeto universitário." },
  { id:3, icon:"📊", tipo:"PESQUISA", titulo:"Análise de Dados Acadêmicos", area:"Tecnologia", modalidade:"Remoto", pessoa:"Ana Souza", curso:"Computação", inicial:"AS", descricao:"Análise exploratória de dados para uma pesquisa acadêmica." },
  { id:4, icon:"🎨", tipo:"DESIGN", titulo:"Criação de identidade visual", area:"Design", modalidade:"Híbrido", pessoa:"Lucas Martins", curso:"Design", inicial:"LM", descricao:"Criação de identidade visual para uma iniciativa estudantil." },
  { id:5, icon:"📱", tipo:"PROJETO", titulo:"Protótipo de aplicativo mobile", area:"Engenharia", modalidade:"Remoto", pessoa:"Beatriz Alves", curso:"Engenharia", inicial:"BA", descricao:"Protótipo funcional para validação de uma ideia acadêmica." },
  { id:6, icon:"📣", tipo:"DIVULGAÇÃO", titulo:"Campanha para evento universitário", area:"Administração", modalidade:"Presencial", pessoa:"Pedro Rocha", curso:"Administração", inicial:"PR", descricao:"Planejamento de divulgação para uma campanha estudantil." },
];
const filtros=["Todos","Tecnologia","Saúde","Direito","Engenharia","Administração","Design"];

function Oportunidades(){
  const [filtro,setFiltro]=useState("Todos");
  const [busca,setBusca]=useState("");
  const [participando,setParticipando]=useState([]);
  const [salvos,setSalvos]=useState(()=>{try{return JSON.parse(localStorage.getItem("marketfaesa-salvos"))||[]}catch{return[]}});
  useEffect(()=>{localStorage.setItem("marketfaesa-salvos",JSON.stringify(salvos))},[salvos]);
  const lista=useMemo(()=>{
    const termo=busca.trim().toLowerCase();
    return dados.filter(item=>(filtro==="Todos"||item.area===filtro)&&(!termo||[item.titulo,item.area,item.tipo,item.modalidade,item.pessoa].join(" ").toLowerCase().includes(termo)));
  },[filtro,busca]);
  function participar(id){setParticipando(estado=>estado.includes(id)?estado.filter(item=>item!==id):[...estado,id]);}
  function alternarSalvo(item){setSalvos(estado=>estado.some(salvo=>salvo.id===item.id)?estado.filter(salvo=>salvo.id!==item.id):[...estado,item]);}

  return <main className="opportunities-page"><div className="opportunities-container">
    <section className="opportunities-header animate__animated animate__fadeInDown">
      <div><span>MARKETFAESA</span><h1>Oportunidades</h1><p>Encontre projetos, trabalhos e experiências para colocar seus conhecimentos em prática.</p></div>
      <div className="opportunities-count"><strong>{lista.length}</strong><span>encontradas</span></div>
    </section>
    <section className="opportunities-toolbar animate__animated animate__fadeInUp">
      <div className="opportunities-search"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar oportunidades..." aria-label="Buscar oportunidades"/></div>
      <div className="opportunities-filters">{filtros.map(item=><button key={item} type="button" className={filtro===item?"selecionado":""} onClick={()=>setFiltro(item)}>{item}</button>)}</div>
    </section>
    {lista.length ? <section className="opportunities-results">{lista.map((item,index)=>{const entrou=participando.includes(item.id);return <article className="opportunity-page-card animate__animated animate__fadeInUp" style={{animationDelay:`${index*70}ms`}} key={item.id}>
      <div className="opportunity-page-card__top"><div className="opportunity-page-card__icon">{item.icon}</div><div className="opportunity-card-top-actions"><button className={salvos.some(salvo=>salvo.id===item.id)?"save-button salvo":"save-button"} type="button" onClick={()=>alternarSalvo(item)} aria-label={salvos.some(salvo=>salvo.id===item.id)?"Remover dos salvos":"Salvar oportunidade"}>{salvos.some(salvo=>salvo.id===item.id)?"♥":"♡"}</button><span>{item.tipo}</span></div></div>
      <h2>{item.titulo}</h2><p className="opportunity-page-card__description">{item.descricao}</p>
      <div className="opportunity-page-card__info"><span>✦ {item.area}</span><span>◷ {item.modalidade}</span></div>
      <div className="opportunity-page-card__footer"><div className="opportunity-page-card__person"><div>{item.inicial}</div><span><strong>{item.pessoa}</strong>{item.curso}</span></div><button type="button" className={entrou?"participando":""} onClick={()=>participar(item.id)}>{entrou?"✓ Participando":"Participar"}</button></div>
    </article>})}</section>:
    <section className="opportunities-empty animate__animated animate__fadeIn"><span>⌕</span><h2>Nenhuma oportunidade encontrada</h2><p>Tente mudar o filtro ou pesquisar por outro termo.</p><button type="button" onClick={()=>{setFiltro("Todos");setBusca("")}}>Limpar filtros</button></section>}
  </div></main>;
}
export default Oportunidades;