import { useState } from "react";

function Perfil({ onNavigate, perfilPublico, mostrarEmail }) {
  const [editando, setEditando] = useState(false);

  const [dados, setDados] = useState({
    nome: "João Silva",
    curso: "Ciência da Computação",
    periodo: "4º período",
    cidade: "Vitória, ES",
    email: "joao.silva@faesa.br",
    bio: "Estudante de Ciência da Computação interessado em desenvolvimento web, tecnologia e projetos colaborativos.",
  });

  const habilidades = ["JavaScript", "React", "HTML", "CSS", "Python", "Git"];

  const interesses = [
    "Desenvolvimento Web",
    "Tecnologia",
    "Inteligência Artificial",
    "Projetos acadêmicos",
  ];

  function alterarCampo(campo, valor) {
    setDados((estado) => ({
      ...estado,
      [campo]: valor,
    }));
  }

  function salvarPerfil() {
    setEditando(false);
  }

  return (
    <main className="perfil-page">
      <div className="perfil-container">
        <section className="perfil-page-header animate__animated animate__fadeInDown">
          <div>
            <span className="perfil-eyebrow">MINHA CONTA</span>

            <h1>Meu Perfil</h1>

            <p>
              Gerencie suas informações e apresente suas habilidades para outros
              estudantes.
            </p>
          </div>

          <button
            className="perfil-back-button"
            type="button"
            onClick={() => onNavigate("inicio")}
          >
            ← Voltar ao início
          </button>
        </section>

        <section
          className="
            perfil-main-card
            animate__animated
            animate__fadeInUp
          "
        >
          <div className="perfil-main-top">
            <div className="perfil-avatar-large">JS</div>

            <div className="perfil-main-info">
              {editando ? (
                <input
                  className="perfil-name-input"
                  value={dados.nome}
                  onChange={(event) => alterarCampo("nome", event.target.value)}
                />
              ) : (
                <h2>
                  {dados.nome}{" "}
                  <span
                    className={`perfil-visibility-badge ${
                      perfilPublico ? "" : "is-privado"
                    }`}
                  >
                    {perfilPublico ? "🌐 Público" : "🔒 Privado"}
                  </span>
                </h2>
              )}

              <span>{dados.curso}</span>

              <div className="perfil-meta">
                <span>🎓 {dados.periodo}</span>

                <span>📍 {dados.cidade}</span>
              </div>
            </div>

            <div className="perfil-actions">
              {editando ? (
                <>
                  <button
                    className="perfil-button secondary"
                    type="button"
                    onClick={() => setEditando(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="perfil-button primary"
                    type="button"
                    onClick={salvarPerfil}
                  >
                    Salvar alterações
                  </button>
                </>
              ) : (
                <button
                  className="perfil-button primary"
                  type="button"
                  onClick={() => setEditando(true)}
                >
                  ✎ Editar perfil
                </button>
              )}
            </div>
          </div>

          <div className="perfil-statistics">
            <div className="perfil-stat">
              <strong>7</strong>

              <span>Conexões</span>
            </div>

            <div className="perfil-stat">
              <strong>3</strong>

              <span>Projetos</span>
            </div>

            <div className="perfil-stat">
              <strong>2</strong>

              <span>Publicações</span>
            </div>

            <div className="perfil-stat">
              <strong>6</strong>

              <span>Habilidades</span>
            </div>
          </div>
        </section>

        <div className="perfil-grid">
          <div className="perfil-column-main">
            {/* SOBRE */}

            <section
              className="
                perfil-section-card
                animate__animated
                animate__fadeInUp
              "
            >
              <div className="perfil-section-heading">
                <div>
                  <span>PERFIL</span>

                  <h3>Sobre mim</h3>
                </div>
              </div>

              {editando ? (
                <textarea
                  className="perfil-bio-input"
                  value={dados.bio}
                  onChange={(event) => alterarCampo("bio", event.target.value)}
                  rows={5}
                />
              ) : (
                <p className="perfil-bio">{dados.bio}</p>
              )}
            </section>

            {/* HABILIDADES */}

            <section
              className="
                perfil-section-card
                animate__animated
                animate__fadeInUp
              "
              style={{ animationDelay: "80ms" }}
            >
              <div className="perfil-section-heading">
                <div>
                  <span>COMPETÊNCIAS</span>

                  <h3>Minhas habilidades</h3>
                </div>

                <button className="perfil-section-link" type="button">
                  + Adicionar
                </button>
              </div>

              <div className="perfil-skills">
                {habilidades.map((habilidade) => (
                  <span className="perfil-skill" key={habilidade}>
                    {habilidade}
                  </span>
                ))}
              </div>
            </section>

            {/* INTERESSES */}

            <section
              className="
                perfil-section-card
                animate__animated
                animate__fadeInUp
              "
              style={{ animationDelay: "160ms" }}
            >
              <div className="perfil-section-heading">
                <div>
                  <span>INTERESSES</span>

                  <h3>Áreas de interesse</h3>
                </div>
              </div>

              <div className="perfil-interests">
                {interesses.map((interesse) => (
                  <div className="perfil-interest" key={interesse}>
                    <span className="perfil-interest-icon">✓</span>

                    <span>{interesse}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="perfil-column-side">
            {/* INFORMAÇÕES */}

            <section
              className="
                perfil-side-card
                animate__animated
                animate__fadeInRight
              "
            >
              <div className="perfil-side-title">
                <h3>Informações</h3>
              </div>

              <div className="perfil-information">
                <div className="perfil-information-item">
                  <span>E-mail</span>

                  {editando ? (
                    <input
                      value={dados.email}
                      onChange={(event) =>
                        alterarCampo("email", event.target.value)
                      }
                    />
                  ) : mostrarEmail ? (
                    <strong>{dados.email}</strong>
                  ) : (
                    <strong className="perfil-info-oculto">
                      Oculto · ative em Configurações
                    </strong>
                  )}
                </div>

                <div className="perfil-information-item">
                  <span>Curso</span>

                  <strong>{dados.curso}</strong>
                </div>

                <div className="perfil-information-item">
                  <span>Período</span>

                  <strong>{dados.periodo}</strong>
                </div>

                <div className="perfil-information-item">
                  <span>Localização</span>

                  <strong>{dados.cidade}</strong>
                </div>
              </div>
            </section>

            {/* PERFIL COMPLETO */}

            <section
              className="
                perfil-completion-card
                animate__animated
                animate__fadeInRight
              "
              style={{ animationDelay: "100ms" }}
            >
              <div className="perfil-completion-icon">✨</div>

              <div>
                <strong>Perfil 68% completo</strong>

                <p>Adicione mais informações para aumentar sua visibilidade.</p>
              </div>

              <div className="perfil-completion-bar">
                <span></span>
              </div>
            </section>

            {/* AÇÕES */}

            <section
              className="
                perfil-side-card
                perfil-quick-actions
                animate__animated
                animate__fadeInRight
              "
              style={{ animationDelay: "180ms" }}
            >
              <h3>Acesso rápido</h3>

              <button type="button">
                ♡<span>Minhas publicações</span>→
              </button>

              <button type="button">
                ☆<span>Itens salvos</span>→
              </button>

              <button type="button" onClick={() => onNavigate("configuracoes")}>
                ⚙<span>Configurações</span>→
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Perfil;
