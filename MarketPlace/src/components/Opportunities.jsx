import { useMemo, useState } from "react";
import "./Opportunities.scss";
import { listarAreas } from "../api/catalogos.js";
import { useCarregar } from "../useCarregar.js";
import { carregarOportunidades, useAcoesOportunidade } from "./acoesOportunidade.js";

function Oportunidades({ usuarioId, initialSearch = "" }){
  const [filtro,setFiltro]=useState("Todos");
  const [busca,setBusca]=useState(initialSearch);
  const { dados: oportunidades, erro, carregando, recarregar, setDados } = useCarregar(carregarOportunidades, []);
  const { dados: areas } = useCarregar(listarAreas, []);
  const { erro: erroAcao, alternar } = useAcoesOportunidade(setDados);
  const filtros=["Todos",...areas.map(area=>area.nome)];
  const lista=useMemo(()=>{
    const termo=busca.trim().toLowerCase();
    return oportunidades.filter(item=>(filtro==="Todos"||item.areas.includes(filtro))&&(!termo||[item.titulo,item.descricao,item.area,item.tipo,item.modalidade,item.pessoa].join(" ").toLowerCase().includes(termo)));
  },[oportunidades,filtro,busca]);

  return <main className="opportunities-page"><div className="opportunities-container">
    <section className="opportunities-header animate__animated animate__fadeInDown">
      <div><span>MARKETFAESA</span><h1>Oportunidades</h1><p>Encontre projetos, trabalhos e experiências para colocar seus conhecimentos em prática.</p></div>
      <div className="opportunities-count"><strong>{lista.length}</strong><span>encontradas</span></div>
    </section>
    {erroAcao && <p className="opportunities-persistence-error" role="alert">{erroAcao}</p>}
    <section className="opportunities-toolbar animate__animated animate__fadeInUp">
      <div className="opportunities-search"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar oportunidades..." aria-label="Buscar oportunidades"/></div>
      <div className="opportunities-filters">{filtros.map(item=><button key={item} type="button" className={filtro===item?"selecionado":""} onClick={()=>setFiltro(item)}>{item}</button>)}</div>
    </section>
    {carregando ? <p className="opportunities-loading" role="status">Carregando oportunidades...</p> :
    erro ? <section className="opportunities-empty"><span>!</span><h2>Não foi possível carregar as oportunidades</h2><p>{erro}</p><button type="button" onClick={recarregar}>Tentar novamente</button></section> :
    lista.length ? <section className="opportunities-results">{lista.map((item,index)=>{const minha=item.autorId===usuarioId;const encerrada=item.status==="FECHADA"&&!item.participando;return <article className="opportunity-page-card animate__animated animate__fadeInUp" style={{animationDelay:`${index*70}ms`}} key={item.id}>
      <div className="opportunity-page-card__top"><div className="opportunity-page-card__icon">{item.icon}</div><div className="opportunity-card-top-actions"><button className={item.salva?"save-button salvo":"save-button"} type="button" onClick={()=>alternar(item,"salva")} aria-label={item.salva?"Remover dos salvos":"Salvar oportunidade"}>{item.salva?"♥":"♡"}</button><span>{item.tipo}</span></div></div>
      <h2>{item.titulo}</h2><p className="opportunity-page-card__description">{item.descricao}</p>
      <div className="opportunity-page-card__info"><span>✦ {item.area}</span><span>◷ {item.modalidade}</span></div>
      <div className="opportunity-page-card__footer"><div className="opportunity-page-card__person"><div>{item.inicial}</div><span><strong>{item.pessoa}</strong>{item.curso}</span></div>{minha?<button type="button" disabled>Sua oportunidade</button>:encerrada?<button type="button" disabled>Encerrada</button>:<button type="button" className={item.participando?"participando":""} onClick={()=>alternar(item,"participando")}>{item.participando?"✓ Participando":"Participar"}</button>}</div>
    </article>})}</section>:
    <section className="opportunities-empty animate__animated animate__fadeIn"><span>⌕</span><h2>Nenhuma oportunidade encontrada</h2><p>{oportunidades.length?"Tente mudar o filtro ou pesquisar por outro termo.":"Ainda não há oportunidades publicadas."}</p><button type="button" onClick={()=>{setFiltro("Todos");setBusca("")}}>Limpar filtros</button></section>}
  </div></main>;
}
export default Oportunidades;
