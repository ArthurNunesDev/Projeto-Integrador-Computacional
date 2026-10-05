import { useEffect, useState } from "react";

function Body({ onNavigate }) {
  const [areaSelecionada, setAreaSelecionada] = useState("Todos");
  const [participando, setParticipando] = useState([]);
  const [detalheAberto, setDetalheAberto] = useState(null);
  const [salvos, setSalvos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("marketfaesa-salvos")) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("marketfaesa-salvos", JSON.stringify(salvos));
  }, [salvos]);

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
                Olá, João! Que habilidade
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
            <div className="profile-avatar">JS</div>

            <h3>João Silva</h3>

            <p>Ciência da Computação · 4º per.</p>

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
          <section className="complete-card">
            <h3>✨ Complete seu perfil</h3>

            <div className="progress-bar">
              <span></span>
            </div>

            <strong>68% concluído</strong>

            <p>Adicione suas habilidades!</p>
          </section>

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
