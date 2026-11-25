import { useCallback, useMemo, useRef, useState } from "react";
import "./Opportunities.scss";
import "./Publications.scss";
import { listarAreas } from "../api/catalogos.js";
import { atualizarOportunidade, criarOportunidade, excluirOportunidade } from "../api/oportunidades.js";
import { MODALIDADES, TIPOS, formatarOportunidade } from "../rotulos.js";
import { mensagemDoErro, useCarregar } from "../useCarregar.js";
import { useDialogo } from "../useDialogo.js";
import { carregarOportunidades, useAcoesOportunidade } from "./acoesOportunidade.js";

const FORMULARIO_VAZIO = { tipo: "PROJETO", titulo: "", descricao: "", modalidade: "REMOTO", status: "ABERTA", areaIds: [] };

function opcoes(rotulos) {
  return Object.entries(rotulos).map(([codigo, rotulo]) => <option key={codigo} value={codigo}>{rotulo}</option>);
}

function Oportunidades({ usuarioId, initialSearch = "" }){
  const [filtro,setFiltro]=useState("Todos");
  const [busca,setBusca]=useState(initialSearch);
  const { dados: oportunidades, erro, carregando, recarregar, setDados } = useCarregar(carregarOportunidades, []);
  const { dados: areas } = useCarregar(listarAreas, []);
  const { erro: erroAcao, alternar } = useAcoesOportunidade(setDados);
  // formulario: null fechado; sem id cria (POST), com id edita (PUT).
  const [formulario,setFormulario]=useState(null);
  const [excluindo,setExcluindo]=useState(null);
  const [enviando,setEnviando]=useState(false);
  const [erroFormulario,setErroFormulario]=useState("");
  const modalRef=useRef(null);
  const fecharModal=useCallback(()=>{setFormulario(null);setExcluindo(null);setErroFormulario("")},[]);
  useDialogo(modalRef,Boolean(formulario||excluindo),fecharModal);
  const filtros=["Todos",...areas.map(area=>area.nome)];
  const lista=useMemo(()=>{
    const termo=busca.trim().toLowerCase();
    return oportunidades.filter(item=>(filtro==="Todos"||item.areas.includes(filtro))&&(!termo||[item.titulo,item.descricao,item.area,item.tipo,item.modalidade,item.pessoa].join(" ").toLowerCase().includes(termo)));
  },[oportunidades,filtro,busca]);

  function abrirFormulario(item){
    setErroFormulario("");
    setFormulario(item?{id:item.id,tipo:item.tipoCodigo,titulo:item.titulo,descricao:item.descricao,modalidade:item.modalidadeCodigo,status:item.status,areaIds:item.areaIds}:FORMULARIO_VAZIO);
  }

  function alternarArea(id){
    setFormulario(atual=>({...atual,areaIds:atual.areaIds.includes(id)?atual.areaIds.filter(areaId=>areaId!==id):[...atual.areaIds,id]}));
  }

  async function salvar(event){
    event.preventDefault();
    const { id, tipo, modalidade, status, areaIds } = formulario;
    const titulo=formulario.titulo.trim();
    const descricao=formulario.descricao.trim();
    if(!titulo||!descricao||!areaIds.length){
      setErroFormulario("Preencha o título, a descrição e escolha ao menos uma área.");
      return;
    }
    const corpo={tipo,titulo,descricao,modalidade,status,areaIds};
    setEnviando(true);
    let salva;
    try{
      salva=formatarOportunidade(await (id?atualizarOportunidade(id,corpo):criarOportunidade(corpo)));
    }catch(e){
      setErroFormulario(mensagemDoErro(e));
      return;
    }finally{
      setEnviando(false);
    }
    setDados(atual=>id?atual.map(item=>item.id===id?salva:item):[salva,...atual]);
    fecharModal();
  }

  async function excluir(){
    const id=excluindo.id;
    setEnviando(true);
    try{
      await excluirOportunidade(id);
    }catch(e){
      setErroFormulario(mensagemDoErro(e));
      return;
    }finally{
      setEnviando(false);
    }
    setDados(atual=>atual.filter(item=>item.id!==id));
    fecharModal();
  }

  return <main className="opportunities-page"><div className="opportunities-container">
    <section className="opportunities-header">
      <div><span>MARKETFAESA</span><h1>Oportunidades</h1><p>Encontre projetos, trabalhos e experiências para colocar seus conhecimentos em prática.</p></div>
      <div className="publications-header-actions"><button className="publications-create-button" type="button" onClick={()=>abrirFormulario(null)}>+ Publicar oportunidade</button><div className="opportunities-count"><strong>{lista.length}</strong><span>encontradas</span></div></div>
    </section>
    {erroAcao && <p className="opportunities-persistence-error" role="alert">{erroAcao}</p>}
    <section className="opportunities-toolbar">
      <div className="opportunities-search"><span>⌕</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar oportunidades..." aria-label="Buscar oportunidades"/></div>
      <div className="opportunities-filters">{filtros.map(item=><button key={item} type="button" className={filtro===item?"selecionado":""} onClick={()=>setFiltro(item)}>{item}</button>)}</div>
    </section>
    {carregando ? <p className="opportunities-loading" role="status">Carregando oportunidades...</p> :
    erro ? <section className="opportunities-empty"><span>!</span><h2>Não foi possível carregar as oportunidades</h2><p>{erro}</p><button type="button" onClick={recarregar}>Tentar novamente</button></section> :
    lista.length ? <section className="opportunities-results">{lista.map((item)=>{const minha=item.autorId===usuarioId;const encerrada=item.status==="FECHADA"&&!item.participando;return <article className="opportunity-page-card" key={item.id}>
      <div className="opportunity-page-card__top"><div className="opportunity-page-card__icon">{item.icon}</div><div className="opportunity-card-top-actions"><button className={item.salva?"save-button salvo":"save-button"} type="button" onClick={()=>alternar(item,"salva")} aria-label={item.salva?"Remover dos salvos":"Salvar oportunidade"}>{item.salva?"♥":"♡"}</button><span>{item.tipo}</span></div></div>
      <h2>{item.titulo}</h2><p className="opportunity-page-card__description">{item.descricao}</p>
      <div className="opportunity-page-card__info"><span>✦ {item.area}</span><span>◷ {item.modalidade}</span></div>
      <div className="opportunity-page-card__footer"><div className="opportunity-page-card__person"><div>{item.inicial}</div><span><strong>{item.pessoa}</strong>{item.curso}</span></div>{minha?<div className="opportunity-owner-actions"><button type="button" onClick={()=>abrirFormulario(item)}>Editar</button><button type="button" className="danger" onClick={()=>{setErroFormulario("");setExcluindo(item)}}>Excluir</button></div>:encerrada?<button type="button" disabled>Encerrada</button>:<button type="button" className={item.participando?"participando":""} onClick={()=>alternar(item,"participando")}>{item.participando?"✓ Participando":"Participar"}</button>}</div>
    </article>})}</section>:
    <section className="opportunities-empty"><span>⌕</span><h2>Nenhuma oportunidade encontrada</h2><p>{oportunidades.length?"Tente mudar o filtro ou pesquisar por outro termo.":"Ainda não há oportunidades publicadas."}</p><button type="button" onClick={()=>{setFiltro("Todos");setBusca("")}}>Limpar filtros</button></section>}

    {formulario && (
      <div className="publication-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)fecharModal()}}>
        <section ref={modalRef} className="publication-modal" role="dialog" aria-modal="true" aria-labelledby="opportunity-modal-title">
          <div className="publication-modal-heading">
            <div><span>OPORTUNIDADE</span><h2 id="opportunity-modal-title">{formulario.id?"Editar oportunidade":"Nova oportunidade"}</h2></div>
            <button type="button" aria-label="Fechar formulário" onClick={fecharModal}>×</button>
          </div>
          <form onSubmit={salvar}>
            {erroFormulario && <p className="publication-persistence-error" role="alert">{erroFormulario}</p>}
            <label>Título<input value={formulario.titulo} onChange={(e)=>setFormulario({...formulario,titulo:e.target.value})} maxLength={150} required /></label>
            <div className="publication-form-row">
              <label>Tipo<select value={formulario.tipo} onChange={(e)=>setFormulario({...formulario,tipo:e.target.value})}>{opcoes(TIPOS)}</select></label>
              <label>Modalidade<select value={formulario.modalidade} onChange={(e)=>setFormulario({...formulario,modalidade:e.target.value})}>{opcoes(MODALIDADES)}</select></label>
            </div>
            <label>Descrição<textarea rows="5" value={formulario.descricao} onChange={(e)=>setFormulario({...formulario,descricao:e.target.value})} maxLength={5000} required /></label>
            <fieldset className="opportunity-form-areas"><legend>Áreas</legend>{areas.map(area=><label key={area.id}><input type="checkbox" checked={formulario.areaIds.includes(area.id)} onChange={()=>alternarArea(area.id)} />{area.nome}</label>)}</fieldset>
            {formulario.id && <label>Status<select value={formulario.status} onChange={(e)=>setFormulario({...formulario,status:e.target.value})}><option value="ABERTA">Aberta</option><option value="FECHADA">Encerrada</option></select></label>}
            <div className="publication-modal-actions"><button type="button" onClick={fecharModal}>Cancelar</button><button type="submit" disabled={enviando}>{formulario.id?"Salvar alterações":"Publicar"}</button></div>
          </form>
        </section>
      </div>
    )}

    {excluindo && (
      <div className="publication-modal-backdrop publication-delete-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)fecharModal()}}>
        <section ref={modalRef} className="publication-delete-modal" role="dialog" aria-modal="true" aria-labelledby="opportunity-delete-title" aria-describedby="opportunity-delete-description">
          <div className="publication-delete-icon" aria-hidden="true">!</div>
          <span className="publication-delete-eyebrow">CONFIRMAÇÃO DE EXCLUSÃO</span>
          <h2 id="opportunity-delete-title">Excluir oportunidade?</h2>
          {erroFormulario && <p className="publication-persistence-error" role="alert">{erroFormulario}</p>}
          <p id="opportunity-delete-description">Você está prestes a excluir <strong>{excluindo.titulo}</strong>. Essa ação não pode ser desfeita.</p>
          <div className="publication-delete-actions">
            <button type="button" className="publication-delete-cancel" onClick={fecharModal}>Cancelar</button>
            <button type="button" className="publication-delete-confirm" onClick={excluir} disabled={enviando}>Sim, excluir</button>
          </div>
        </section>
      </div>
    )}
  </div></main>;
}
export default Oportunidades;
