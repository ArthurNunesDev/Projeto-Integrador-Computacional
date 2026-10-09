import { useEffect, useState } from "react";

import { calcularProgressoPerfil } from "../perfil.js";

function obterPerfil(usuario) {
  return {
    nome: usuario?.nome || "",
    curso: usuario?.curso || "",
    periodo: usuario?.periodo || "",
    cidade: usuario?.cidade || "",
    email: usuario?.email || "",
    bio: usuario?.bio || "",
  };
}

function Perfil({ onNavigate, perfilPublico, mostrarEmail, usuario, onUpdateUsuario }) {
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState(() => obterPerfil(usuario));
  const [salvo, setSalvo] = useState(false);
  const [mostrarConquista, setMostrarConquista] = useState(false);

  function alterarCampo(campo, valor) {
    setDados((estado) => ({ ...estado, [campo]: valor }));
    setSalvo(false);
  }

  function salvarPerfil() {
    const nome = dados.nome.trim();
    if (!nome) return;

    // O e-mail é o login e não muda por aqui; o resto fica salvo localmente (ver src/perfil.js).
    const atualizados = { ...dados, nome };
    setDados(atualizados);
    onUpdateUsuario?.({ nome, curso: dados.curso, periodo: dados.periodo, cidade: dados.cidade, bio: dados.bio });
    setEditando(false);
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);

    const progressoFinal = calcularProgressoPerfil({ ...usuario, ...atualizados });
    if (progressoFinal === 100) {
      setMostrarConquista(true);
      window.setTimeout(() => setMostrarConquista(false), 4200);
    }
  }

  function cancelarEdicao() {
    setDados(obterPerfil(usuario));
    setEditando(false);
    setSalvo(false);
  }

  function iniciais(nome) {
    return nome.split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || "US";
  }

  return (
    <main className="perfil-page">
      <div className="perfil-container">
        <section className="perfil-page-header animate__animated animate__fadeInDown">
          <div><span className="perfil-eyebrow">MINHA CONTA</span><h1>Meu Perfil</h1><p>Gerencie suas informações e apresente suas habilidades para outros estudantes.</p></div>
          <button className="page-back-button perfil-back-button" type="button" onClick={() => onNavigate("inicio")}>← Voltar ao início</button>
        </section>

        {salvo && <div className="perfil-save-feedback">✓ Perfil atualizado e salvo</div>}

        {mostrarConquista && (
          <div className="perfil-completo-overlay" role="dialog" aria-modal="true">
            <div className="perfil-completo-card">
              <div className="perfil-completo-icon">🎉</div>
              <span>PERFIL COMPLETO!</span>
              <h2>Obrigado por completar seu perfil! ✨</h2>
              <p>Agora sua presença na MarketFAESA está pronta para conectar você a novas oportunidades.</p>
              <div className="perfil-completo-sparkles">✦{"\u3000"}✧{"\u3000"}✦</div>
            </div>
          </div>
        )}

        <section className="perfil-main-card animate__animated animate__fadeInUp">
          <div className="perfil-main-top">
            <div className="perfil-avatar-large">{iniciais(dados.nome)}</div>
            <div className="perfil-main-info">
              {editando ? <input className="perfil-name-input" value={dados.nome} onChange={(e) => alterarCampo("nome", e.target.value)} /> : (
                <h2>{dados.nome} <span className={"perfil-visibility-badge " + (perfilPublico ? "" : "is-privado")}>{perfilPublico ? "🌐 Público" : "🔒 Privado"}</span></h2>
              )}
              {editando ? <input className="perfil-inline-input" value={dados.curso} onChange={(e) => alterarCampo("curso", e.target.value)} /> : <span>{dados.curso}</span>}
              <div className="perfil-meta">{editando ? <><input className="perfil-inline-input small" value={dados.periodo} onChange={(e) => alterarCampo("periodo", e.target.value)} /><input className="perfil-inline-input small" value={dados.cidade} onChange={(e) => alterarCampo("cidade", e.target.value)} /></> : <><span>🎓 {dados.periodo}</span><span>📍 {dados.cidade}</span></>}</div>
            </div>
            <div className="perfil-actions">
              {editando ? <>
                <button className="perfil-button secondary" type="button" onClick={cancelarEdicao}>Cancelar</button>
                <button className="perfil-button primary" type="button" onClick={salvarPerfil}>Salvar alterações</button>
              </> : <button className="perfil-button primary" type="button" onClick={() => setEditando(true)}>✎ Editar perfil</button>}
            </div>
          </div>

          <div className="perfil-statistics">
            <div className="perfil-stat"><strong>7</strong><span>Conexões</span></div>
            <div className="perfil-stat"><strong>3</strong><span>Projetos</span></div>
            <div className="perfil-stat"><strong>2</strong><span>Publicações</span></div>
            <div className="perfil-stat"><strong>6</strong><span>Habilidades</span></div>
          </div>
        </section>

        <div className="perfil-grid">
          <div className="perfil-column-main">
            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>PERFIL</span><h3>Sobre mim</h3></div></div>
              {editando ? <textarea className="perfil-bio-input" value={dados.bio} onChange={(e) => alterarCampo("bio", e.target.value)} rows={5} /> : <p className="perfil-bio">{dados.bio}</p>}
            </section>

            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>COMPETÊNCIAS</span><h3>Minhas habilidades</h3></div><button className="perfil-section-link" type="button" onClick={() => onNavigate("publicar-habilidade")}>+ Adicionar</button></div>
              <div className="perfil-skills">{["JavaScript","React","HTML","CSS","Python","Git"].map((habilidade) => <span className="perfil-skill" key={habilidade}>{habilidade}</span>)}</div>
            </section>

            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>INTERESSES</span><h3>Áreas de interesse</h3></div></div>
              <div className="perfil-interests">{["Desenvolvimento Web","Tecnologia","Inteligência Artificial","Projetos acadêmicos"].map((interesse) => <div className="perfil-interest" key={interesse}><span className="perfil-interest-icon">✓</span><span>{interesse}</span></div>)}</div>
            </section>
          </div>

          <aside className="perfil-column-side">
            <section className="perfil-side-card animate__animated animate__fadeInRight">
              <div className="perfil-side-title"><h3>Informações</h3></div>
              <div className="perfil-information">
                <div className="perfil-information-item"><span>E-mail</span>{editando ? <strong>{dados.email}</strong> : mostrarEmail ? <strong>{dados.email}</strong> : <strong className="perfil-info-oculto">Oculto · ative em Configurações</strong>}</div>
                <div className="perfil-information-item"><span>Curso</span><strong>{dados.curso}</strong></div>
                <div className="perfil-information-item"><span>Período</span><strong>{dados.periodo}</strong></div>
                <div className="perfil-information-item"><span>Localização</span><strong>{dados.cidade}</strong></div>
              </div>
            </section>

            <PerfilConclusao usuario={usuario} onNavigate={onNavigate} />

            <section className="perfil-side-card perfil-quick-actions">
              <h3>Acesso rápido</h3>
              <button type="button" onClick={() => onNavigate("publicacoes")}>♡<span>Minhas publicações</span>→</button>
              <button type="button" onClick={() => onNavigate("salvos")}>☆<span>Itens salvos</span>→</button>
              <button type="button" onClick={() => onNavigate("configuracoes")}>⚙<span>Configurações</span>→</button>
            </section>

            <section className="perfil-side-card perfil-danger-card">
              <h3>Conta</h3>
              <p>Disponível em breve: a exclusão de conta ainda não existe na API.</p>
              <button type="button" disabled title="Disponível em breve">Excluir minha conta</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PerfilConclusao({ usuario, onNavigate }) {
  const [progresso, setProgresso] = useState(() => calcularProgressoPerfil(usuario));

  useEffect(() => {
    const atualizar = () => setProgresso(calcularProgressoPerfil(usuario));
    atualizar();
    window.addEventListener("storage", atualizar);
    window.addEventListener("marketfaesa-perfil-atualizado", atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener("marketfaesa-perfil-atualizado", atualizar);
    };
  }, [usuario]);

  if (progresso >= 100) return null;

  return (
    <section className="perfil-completion-card animate__animated animate__fadeInRight">
      <div className="perfil-completion-icon">✨</div>
      <div>
        <strong>Perfil {progresso}% completo</strong>
        <p>Complete suas informações para aumentar sua visibilidade.</p>
      </div>
      <div className="perfil-completion-bar"><span style={{ width: progresso + "%" }}></span></div>
      <button type="button" onClick={() => onNavigate("perfil")}>Continuar preenchendo →</button>
    </section>
  );
}

export default Perfil;
