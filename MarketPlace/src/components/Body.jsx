import { useEffect, useState } from "react";

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

function Body({ onNavigate, usuario }) {
  const nomeUsuario = usuario?.nome || "João Silva";
  const cursoUsuario = usuario?.curso || "Ciência da Computação";
  const periodoUsuario = usuario?.periodo || "4º período";
  const iniciaisUsuario = nomeUsuario.split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || "JS";
  const [areaSelecionada, setAreaSelecionada] = useState("Todos");
  const [participando, setParticipando] = useState([]);
  const [detalheAberto, setDetalheAberto] = useState(null);
  const [perfilProgresso, setPerfilProgresso] = useState(() => calcularProgressoPerfil(usuario));
  const [perfilConcluido, setPerfilConcluido] = useState(false);
  const [mostrarPerfilCompleto, setMostrarPerfilCompleto] = useState(false);
  const [salvos, setSalvos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("marketfaesa-salvos")) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("marketfaesa-salvos", JSON.stringify(salvos));
  }, [salvos]);

  useEffect(() => {
    const chaveConclusao = usuario?.email
      ? "marketfaesa-perfil-completo-pendente:" + usuario.email.trim().toLowerCase()
      : "";

    if (chaveConclusao && localStorage.getItem(chaveConclusao) === "1") {
      localStorage.removeItem(chaveConclusao);
      setPerfilProgresso(100);
      setPerfilConcluido(true);
      setMostrarPerfilCompleto(true);
      const timer = window.setTimeout(() => setMostrarPerfilCompleto(false), 4200);
      return () => window.clearTimeout(timer);
    }

    const atualizarProgresso = () => {
      const progresso = calcularProgressoPerfil(usuario);
      setPerfilProgresso(progresso);
      if (progresso < 100) {
        setPerfilConcluido(false);
      }
    };

    atualizarProgresso();
    window.addEventListener("storage", atualizarProgresso);
    window.addEventListener("marketfaesa-perfil-atualizado", atualizarProgresso);

    return () => {
      window.removeEventListener("storage", atualizarProgresso);
      window.removeEventListener("marketfaesa-perfil-atualizado", atualizarProgresso);
    };
  }, [usuario]);

  const areas = ["Todos", "Tecnologia", "Saúde", "Direito", "Engenharia", "Administração", "Design"];

  const oportunidades = [
    {
      icon: "💻",
      tipo: "PROJETO",
      titulo: "Desenvolvimento de App para Clínica",
      area: "Saúde + TI",
      modalidade: "Remoto",
      pessoa: "Maria Lima",
      curso: "Medicina",
      id: 1,
      inicial: "ML",
      descricao: "Apoio na criação de um aplicativo para organização de atendimentos.",
    },
    {
      icon: "⚖️",
      tipo: "CONSULTORIA",
      titulo: "Revisão Jurídica de Contratos Digitais",
      area: "Direito + TI",
      modalidade: "Híbrido",
      pessoa: "Rafael Costa",
      curso: "Direito",
      id: 2,
      inicial: "RC",
      descricao: "Revisão e organização de contratos para um projeto universitário.",
    },
    {
      icon: "📊",
      tipo: "PESQUISA",
      titulo: "Análise de Dados Acadêmicos",
      area: "Tecnologia",
      modalidade: "Remoto",
      pessoa: "Ana Souza",
      curso: "Computação",
      id: 3,
      inicial: "AS",
      descricao: "Análise exploratória de dados para uma pesquisa acadêmica.",
    },
    {
      icon: "🎨",
      tipo: "DESIGN",
      titulo: "Criação de identidade visual",
      area: "Design",
      modalidade: "Híbrido",
      pessoa: "Lucas Martins",
      curso: "Design",
      id: 4,
      inicial: "LM",
      descricao: "Criação de identidade visual para uma iniciativa estudantil.",
    },
  ];

  const oportunidadesFiltradas = oportunidades.filter((item) =>
    areaSelecionada === "Todos" ||
    item.area.toLowerCase().includes(areaSelecionada.toLowerCase()),
  );

  function alternarSalvo(item) {
    setSalvos((estado) => estado.some((salvo) => salvo.id === item.id)
      ? estado.filter((salvo) => salvo.id !== item.id)
      : [...estado, item]);
  }

  function alternarParticipacao(id) {
    setParticipando((estado) =>
      estado.includes(id)
        ? estado.filter((item) => item !== id)
        : [...estado, id],
    );
  }

  return (
    <main className="main-content">
      <div className="dashboard-container">
        <section className="dashboard-main">
          {/* HERO */}
          <section className="welcome-card animate__animated animate__fadeInDown">
            <div className="welcome-content">
              <span className="welcome-small">MARKETFAESA</span>

              <h2>
                Olá, {nomeUsuario.split(" ")[0]}! Que habilidade
                <br />
                você quer explorar hoje?
              </h2>

              <p>
                Conecte-se com estudantes de outros cursos, encontre
                oportunidades e desenvolva experiência real.
              </p>

              <button className="welcome-button" type="button" onClick={() => onNavigate?.("publicar-habilidade")}>+ Publicar habilidade</button>
            </div>

            <div className="welcome-decoration">
              <span></span>
              <span></span>
            </div>
          </section>

          {/* ESTATÍSTICAS */}
          <section className="stats-grid">
            <div className="stat-card animate__animated animate__zoomIn">
              <strong>1.847</strong>

              <span>Estudantes ativos</span>

              <small>↑ +23 esta semana</small>
            </div>

            <div className="stat-card animate__animated animate__zoomIn">
              <strong>342</strong>

              <span>Oportunidades abertas</span>

              <small>↑ +18 novos hoje</small>
            </div>

            <div className="stat-card animate__animated animate__zoomIn">
              <strong>96</strong>

              <span>Habilidades disponíveis</span>

              <small>↑ +7 esta semana</small>
            </div>
          </section>

          {/* ÁREAS */}
          <section className="areas-section">
            <div className="section-title">
              <h3>Áreas de Conhecimento</h3>
            </div>

            <div className="areas-list">
              {areas.map((area) => (
                <button
                  className={"area-pill " + (areaSelecionada === area ? "selecionado" : "")}
                  key={area}
                  type="button"
                  onClick={() => setAreaSelecionada(area)}
                >
                  <span></span>
                  {area}
                </button>
              ))}
            </div>
          </section>

          {/* OPORTUNIDADES */}
          <section className="opportunities-section">
            <div className="section-heading">
              <div>
                <h3>Oportunidades em Destaque</h3>
                {areaSelecionada !== "Todos" && (
                  <span className="section-filter-label">Filtrando por {areaSelecionada}</span>
                )}
              </div>
              <button className="see-all-button" type="button" onClick={() => onNavigate?.("oportunidades")}>Ver todas →</button>
            </div>

            {oportunidadesFiltradas.length > 0 ? (
              <div className="opportunities-grid">
                {oportunidadesFiltradas.map((item) => {
                  const entrou = participando.includes(item.id);
                  return (
                    <article className="opportunity-card animate__animated animate__fadeInUp" key={item.titulo}>
                      <button className="opportunity-card-open" type="button" onClick={() => setDetalheAberto(item)} aria-label={"Ver detalhes de " + item.titulo}>
                        <div className="opportunity-top">
                          <div className="opportunity-icon">{item.icon}</div>
                          <span className="opportunity-type">{item.tipo}</span>
                        </div>
                        <h4>{item.titulo}</h4>
                        <div className="opportunity-info">
                          <span>👥 {item.area}</span>
                          <span>◷ {item.modalidade}</span>
                        </div>
                      </button>
                      <div className="opportunity-footer">
                        <div className="person">
                          <div className="person-avatar">{item.inicial}</div>
                          <div><strong>{item.pessoa}</strong><span>{item.curso}</span></div>
                        </div>
                        <div className="opportunity-actions">
                          <button className="details-button" type="button" onClick={() => setDetalheAberto(item)}>Detalhes</button>
                          <button className={salvos.some((salvo) => salvo.id === item.id) ? "save-button salvo" : "save-button"} type="button" onClick={() => alternarSalvo(item)} aria-label={salvos.some((salvo) => salvo.id === item.id) ? "Remover dos salvos" : "Salvar oportunidade"}>{salvos.some((salvo) => salvo.id === item.id) ? "♥" : "♡"}</button>
                          <button className={entrou ? "participating-button" : ""} type="button" onClick={() => alternarParticipacao(item.id)}>
                            {entrou ? "✓ Participando" : "Participar"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="opportunities-empty-home">
                <strong>Nenhuma oportunidade nesta área</strong>
                <span>Escolha outra área para continuar explorando.</span>
              </div>
            )}
          </section>
        </section>

        <aside className="dashboard-sidebar">
          {/* PERFIL */}
          <section className="profile-card animate__animated animate__fadeInRight">
            <div className="profile-avatar">{iniciaisUsuario}</div>

            <h3>{nomeUsuario}</h3>

            <p>{cursoUsuario} · {periodoUsuario.replace(/\s*período$/i, " per.")}</p>

            <div className="profile-stats">
              <div>
                <strong>7</strong>
                <span>Conexões</span>
              </div>

              <div>
                <strong>3</strong>
                <span>Projetos</span>
              </div>

              <div>
                <strong>2</strong>
                <span>Skills</span>
              </div>
            </div>
          </section>

          {/* COMPLETAR PERFIL */}
          {!perfilConcluido && (
            <section className="complete-card">
              <h3>✨ Complete seu perfil</h3>
              <div className="progress-bar"><span style={{ width: perfilProgresso + "%" }}></span></div>
              <strong>{perfilProgresso}% concluído</strong>
              <p>Adicione suas informações e habilidades!</p>
              <button type="button" onClick={() => onNavigate?.("perfil")}>Completar perfil →</button>
            </section>
          )}

          {mostrarPerfilCompleto && (
            <div className="perfil-completo-overlay" role="dialog" aria-modal="true">
              <div className="perfil-completo-card">
                <div className="perfil-completo-icon">🎉</div>
                <span>PERFIL COMPLETO!</span>
                <h2>Obrigado por completar seu perfil! ✨</h2>
                <p>Agora sua presença na MarketFAESA está pronta para conectar você a novas oportunidades.</p>
                <div className="perfil-completo-sparkles">✦　✧　✦</div>
              </div>
            </div>
          )}

          {/* MAIS BUSCADAS */}
          <section className="popular-card">
            <h3>🔥 Habilidades mais buscadas</h3>

            <ol>
              <li>
                <span>1</span>
                <strong>Desenvolvimento Web</strong>
                <small>128 buscas</small>
              </li>

              <li>
                <span>2</span>
                <strong>Design UX/UI</strong>
                <small>94 buscas</small>
              </li>

              <li>
                <span>3</span>
                <strong>Análise de Dados</strong>
                <small>87 buscas</small>
              </li>

              <li>
                <span>4</span>
                <strong>Marketing Digital</strong>
                <small>72 buscas</small>
              </li>

              <li>
                <span>5</span>
                <strong>Redação Jurídica</strong>
                <small>61 buscas</small>
              </li>
            </ol>
          </section>
        </aside>
      </div>

      {detalheAberto && (
        <div className="opportunity-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setDetalheAberto(null);
        }}>
          <section className="opportunity-modal animate__animated animate__fadeInUp" role="dialog" aria-modal="true">
            <button className="opportunity-modal-close" type="button" onClick={() => setDetalheAberto(null)} aria-label="Fechar detalhes">×</button>
            <div className="opportunity-modal-icon">{detalheAberto.icon}</div>
            <span className="opportunity-type">{detalheAberto.tipo}</span>
            <h2>{detalheAberto.titulo}</h2>
            <p>{detalheAberto.descricao}</p>
            <div className="opportunity-modal-info">
              <span>👥 {detalheAberto.area}</span>
              <span>◷ {detalheAberto.modalidade}</span>
              <span>◉ Publicado por {detalheAberto.pessoa}</span>
            </div>
            <div className="opportunity-modal-footer">
              <div className="person"><div className="person-avatar">{detalheAberto.inicial}</div><div><strong>{detalheAberto.pessoa}</strong><span>{detalheAberto.curso}</span></div></div>
              <button className={salvos.some((salvo) => salvo.id === detalheAberto.id) ? "save-button salvo" : "save-button"} type="button" onClick={() => alternarSalvo(detalheAberto)}>{salvos.some((salvo) => salvo.id === detalheAberto.id) ? "♥ Salvo" : "♡ Salvar"}</button>
              <button className={participando.includes(detalheAberto.id) ? "participating-button" : ""} type="button" onClick={() => alternarParticipacao(detalheAberto.id)}>
                {participando.includes(detalheAberto.id) ? "✓ Participando" : "Participar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Body;
