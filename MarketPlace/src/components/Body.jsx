function Body() {
  const oportunidades = [
    {
      icon: "💻",
      tipo: "PROJETO",
      titulo: "Desenvolvimento de App para Clínica",
      area: "Saúde + TI",
      modalidade: "Remoto",
      pessoa: "Maria Lima",
      curso: "Medicina",
      inicial: "ML",
    },
    {
      icon: "⚖️",
      tipo: "CONSULTORIA",
      titulo: "Revisão Jurídica de Contratos Digitais",
      area: "Direito + TI",
      modalidade: "Híbrido",
      pessoa: "Rafael Costa",
      curso: "Direito",
      inicial: "RC",
    },
    {
      icon: "📊",
      tipo: "PESQUISA",
      titulo: "Análise de Dados Acadêmicos",
      area: "Tecnologia",
      modalidade: "Remoto",
      pessoa: "Ana Souza",
      curso: "Computação",
      inicial: "AS",
    },
    {
      icon: "🎨",
      tipo: "DESIGN",
      titulo: "Criação de identidade visual",
      area: "Design",
      modalidade: "Híbrido",
      pessoa: "Lucas Martins",
      curso: "Design",
      inicial: "LM",
    },
  ];

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

              <button className="welcome-button">+ Publicar habilidade</button>
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

            <div
              className="stat-card animate__animated animate__zoomIn"
              style={{ animationDelay: "80ms" }}
            >
              <strong>342</strong>

              <span>Oportunidades abertas</span>

              <small>↑ +18 novos hoje</small>
            </div>

            <div
              className="stat-card animate__animated animate__zoomIn"
              style={{ animationDelay: "160ms" }}
            >
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
              <button className="area-pill selecionado">
                <span></span>
                Todos
              </button>

              <button className="area-pill">
                <span></span>
                Tecnologia
              </button>

              <button className="area-pill">
                <span></span>
                Saúde
              </button>

              <button className="area-pill">
                <span></span>
                Direito
              </button>

              <button className="area-pill">
                <span></span>
                Engenharia
              </button>

              <button className="area-pill">
                <span></span>
                Administração
              </button>

              <button className="area-pill">
                <span></span>
                Design
              </button>
            </div>
          </section>

          {/* OPORTUNIDADES */}
          <section className="opportunities-section">
            <div className="section-heading">
              <h3>Oportunidades em Destaque</h3>

              <button>Ver todas →</button>
            </div>

            <div className="opportunities-grid">
              {oportunidades.map((item, index) => (
                <article
                  className="opportunity-card animate__animated animate__fadeInUp"
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                  key={item.titulo}
                >
                  <div className="opportunity-top">
                    <div className="opportunity-icon">{item.icon}</div>

                    <span className="opportunity-type">{item.tipo}</span>
                  </div>

                  <h4>{item.titulo}</h4>

                  <div className="opportunity-info">
                    <span>👥 {item.area}</span>

                    <span>◷ {item.modalidade}</span>
                  </div>

                  <div className="opportunity-footer">
                    <div className="person">
                      <div className="person-avatar">{item.inicial}</div>

                      <div>
                        <strong>{item.pessoa}</strong>

                        <span>{item.curso}</span>
                      </div>
                    </div>

                    <button>Participar</button>
                  </div>
                </article>
              ))}
            </div>
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
    </main>
  );
}

export default Body;
