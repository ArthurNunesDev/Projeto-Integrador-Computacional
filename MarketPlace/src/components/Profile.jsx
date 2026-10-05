import { useEffect, useState } from "react";

const CHAVE_PERFIL = "marketfaesa-perfil";

function chavePerfil(usuario) {
  return usuario?.email ? `${CHAVE_PERFIL}:${usuario.email.toLowerCase()}` : CHAVE_PERFIL;
}

const PERFIL_PADRAO = {
  nome: "",
  curso: "Ciência da Computação",
  periodo: "4º período",
  cidade: "Vitória, ES",
  email: "",
  bio: "Estudante de Ciência da Computação interessado em desenvolvimento web, tecnologia e projetos colaborativos.",
};

function obterPerfil(usuario) {
  const dadosBase = {
    ...PERFIL_PADRAO,
    nome: usuario?.nome || "",
    email: usuario?.email || "",
  };

  try {
    const salvo = localStorage.getItem(chavePerfil(usuario));
    if (salvo) return { ...dadosBase, ...JSON.parse(salvo) };
  } catch {}

  return dadosBase;
}

function Perfil({ onNavigate, perfilPublico, mostrarEmail, usuario, onUpdateUsuario, onDeleteAccount }) {
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState(() => obterPerfil(usuario));
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    localStorage.setItem(chavePerfil(usuario), JSON.stringify(dados));
    window.dispatchEvent(new Event("marketfaesa-perfil-atualizado"));
  }, [dados]);

  function alterarCampo(campo, valor) {
    setDados((estado) => ({ ...estado, [campo]: valor }));
    setSalvo(false);
  }

  function salvarPerfil() {
    const nome = dados.nome.trim();
    const email = dados.email.trim().toLowerCase();
    if (!nome || !email) return;

    const atualizados = { ...dados, nome, email };
    setDados(atualizados);
    localStorage.setItem(chavePerfil(usuario), JSON.stringify(atualizados));
    onUpdateUsuario?.({ nome, email, usuario: email });
    setEditando(false);
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);
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
          <button className="perfil-back-button" type="button" onClick={() => onNavigate("inicio")}>← Voltar ao início</button>
        </section>

        {salvo && <div className="perfil-save-feedback">✓ Perfil atualizado e salvo</div>}

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
                <div className="perfil-information-item"><span>E-mail</span>{editando ? <input value={dados.email} onChange={(e) => alterarCampo("email", e.target.value)} /> : mostrarEmail ? <strong>{dados.email}</strong> : <strong className="perfil-info-oculto">Oculto · ative em Configurações</strong>}</div>
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
              <p>Excluir sua conta remove os dados locais desta conta e encerra a sessão.</p>
              <button type="button" onClick={() => { if (window.confirm("Deseja realmente excluir sua conta? Esta ação não pode ser desfeita.")) onDeleteAccount?.(); }}>Excluir minha conta</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function calcularProgressoPerfil(usuario) {
  const email = usuario?.email?.trim().toLowerCase();
  if (!email) return 0;
  let perfil = {};
  let habilidades = [];
  try {
    perfil = JSON.parse(localStorage.getItem("marketfaesa-perfil:" + email) || "{}");
    habilidades = JSON.parse(localStorage.getItem("marketfaesa-habilidades") || "[]");
  } catch {}
  const campos = [
    Boolean((perfil.nome || usuario?.nome || "").trim()),
    Boolean((perfil.email || usuario?.email || "").trim()),
    Boolean((perfil.curso || "").trim()),
    Boolean((perfil.periodo || "").trim()),
    Boolean((perfil.cidade || "").trim()),
    Boolean((perfil.bio || "").trim()),
    habilidades.some((item) => item?.nome?.trim()),
  ];
  return Math.round((campos.filter(Boolean).length / campos.length) * 100);
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

  if (progresso === 100) {
    return (
      <section className="perfil-completion-card perfil-completion-finished animate__animated animate__fadeInRight">
        <div className="perfil-completion-icon">🎉</div>
        <div>
          <span>PERFIL COMPLETO!</span>
          <strong>Seu perfil está pronto para brilhar ✨</strong>
          <p>Mostre suas habilidades e encontre novas oportunidades.</p>
        </div>
        <div className="perfil-completion-sparkles" aria-hidden="true">✦ ✧ ✦</div>
      </section>
    );
  }

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
