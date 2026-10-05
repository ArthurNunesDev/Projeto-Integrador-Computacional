import { useMemo, useState } from "react";

const perfis = [
  {
    id: 1,
    nome: "Ana Souza",
    curso: "Ciência da Computação · 6º período",
    cidade: "Vitória, ES",
    inicial: "AS",
    bio: "Gosto de transformar problemas em interfaces simples e experiências digitais úteis.",
    habilidades: [
      { nome: "React", nivel: "Avançado", categoria: "Tecnologia" },
      { nome: "JavaScript", nivel: "Avançado", categoria: "Tecnologia" },
      { nome: "UX/UI Design", nivel: "Intermediário", categoria: "Design" },
    ],
  },
  {
    id: 2,
    nome: "Lucas Martins",
    curso: "Design · 5º período",
    cidade: "Vila Velha, ES",
    inicial: "LM",
    bio: "Designer focado em identidade visual, interfaces e comunicação para projetos universitários.",
    habilidades: [
      { nome: "Figma", nivel: "Avançado", categoria: "Design" },
      { nome: "UI Design", nivel: "Avançado", categoria: "Design" },
      { nome: "Branding", nivel: "Intermediário", categoria: "Comunicação" },
    ],
  },
  {
    id: 3,
    nome: "Rafael Costa",
    curso: "Direito · 7º período",
    cidade: "Vitória, ES",
    inicial: "RC",
    bio: "Interesse em tecnologia, contratos digitais e pesquisa jurídica.",
    habilidades: [
      { nome: "Redação Jurídica", nivel: "Avançado", categoria: "Direito" },
      { nome: "Contratos", nivel: "Avançado", categoria: "Direito" },
      { nome: "Pesquisa", nivel: "Intermediário", categoria: "Acadêmico" },
    ],
  },
  {
    id: 4,
    nome: "Marina Oliveira",
    curso: "Administração · 4º período",
    cidade: "Serra, ES",
    inicial: "MO",
    bio: "Apaixonada por organização, estratégia e análise de negócios.",
    habilidades: [
      { nome: "Excel", nivel: "Avançado", categoria: "Administração" },
      { nome: "Marketing Digital", nivel: "Intermediário", categoria: "Marketing" },
      { nome: "Análise de Dados", nivel: "Intermediário", categoria: "Tecnologia" },
    ],
  },
];

const categorias = ["Todas", "Tecnologia", "Design", "Direito", "Administração", "Comunicação"];

function Habilidades({ onNavigate }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [conectados, setConectados] = useState([]);

  const perfisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return perfis.filter((perfil) => {
      const correspondeBusca =
        !termo ||
        perfil.nome.toLowerCase().includes(termo) ||
        perfil.curso.toLowerCase().includes(termo) ||
        perfil.habilidades.some((habilidade) =>
          habilidade.nome.toLowerCase().includes(termo),
        );

      const correspondeCategoria =
        categoria === "Todas" ||
        perfil.habilidades.some((habilidade) => habilidade.categoria === categoria);

      return correspondeBusca && correspondeCategoria;
    });
  }, [busca, categoria]);

  function alternarConexao(id) {
    setConectados((estado) =>
      estado.includes(id)
        ? estado.filter((item) => item !== id)
        : [...estado, id],
    );
  }

  if (perfilSelecionado) {
    const conectado = conectados.includes(perfilSelecionado.id);

    return (
      <main className="people-skills-page">
        <div className="people-skills-container">
          <button className="people-back-button" type="button" onClick={() => setPerfilSelecionado(null)}>
            ← Voltar para Habilidades
          </button>

          <section className="person-profile-header animate__animated animate__fadeInDown">
            <div className="person-profile-avatar">{perfilSelecionado.inicial}</div>
            <div className="person-profile-main">
              <span className="people-eyebrow">PERFIL DO ESTUDANTE</span>
              <h1>{perfilSelecionado.nome}</h1>
              <p>{perfilSelecionado.curso}</p>
              <span className="person-location">⌖ {perfilSelecionado.cidade}</span>
            </div>
            <button
              className={conectado ? "connect-button conectado" : "connect-button"}
              type="button"
              onClick={() => alternarConexao(perfilSelecionado.id)}
            >
              {conectado ? "✓ Conectado" : "+ Conectar"}
            </button>
          </section>

          <section className="person-about animate__animated animate__fadeInUp">
            <span className="people-section-label">SOBRE</span>
            <p>{perfilSelecionado.bio}</p>
          </section>

          <section className="person-skills-section animate__animated animate__fadeInUp">
            <div className="people-section-heading">
              <div>
                <span className="people-section-label">COMPETÊNCIAS</span>
                <h2>Habilidades de {perfilSelecionado.nome.split(" ")[0]}</h2>
              </div>
              <strong>{perfilSelecionado.habilidades.length} habilidades</strong>
            </div>

            <div className="person-skill-grid">
              {perfilSelecionado.habilidades.map((habilidade) => (
                <article className="person-skill-card" key={habilidade.nome}>
                  <div className="person-skill-icon">✦</div>
                  <div>
                    <span>{habilidade.categoria}</span>
                    <h3>{habilidade.nome}</h3>
                    <p>Nível {habilidade.nivel}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="people-skills-page">
      <div className="people-skills-container">
        <section className="people-hero animate__animated animate__fadeInDown">
          <div>
            <span className="people-eyebrow">DESCUBRA TALENTOS</span>
            <h1>Habilidades</h1>
            <p>Encontre estudantes, conheça suas competências e descubra com quem você pode colaborar.</p>
          </div>
          <div className="people-hero-count">
            <strong>{perfis.length}</strong>
            <span>perfis disponíveis</span>
          </div>
        </section>

        <section className="people-search-panel animate__animated animate__fadeInUp">
          <label className="people-search">
            <span>⌕</span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por pessoa, curso ou habilidade..."
            />
          </label>

          <div className="people-filters">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={categoria === item ? "people-filter ativo" : "people-filter"}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="people-results-heading">
          <div>
            <span className="people-section-label">ESTUDANTES</span>
            <h2>Quem pode ajudar você?</h2>
          </div>
          <span>{perfisFiltrados.length} resultado{perfisFiltrados.length === 1 ? "" : "s"}</span>
        </div>

        {perfisFiltrados.length ? (
          <section className="people-grid">
            {perfisFiltrados.map((perfil, index) => (
              <button
                type="button"
                className="person-card animate__animated animate__fadeInUp"
                style={{ animationDelay: `${index * 70}ms` }}
                key={perfil.id}
                onClick={() => setPerfilSelecionado(perfil)}
              >
                <div className="person-card-header">
                  <div className="person-card-avatar">{perfil.inicial}</div>
                  <div className="person-card-identity">
                    <h3>{perfil.nome}</h3>
                    <p>{perfil.curso}</p>
                  </div>
                  <span className="person-card-arrow">→</span>
                </div>

                <p className="person-card-bio">{perfil.bio}</p>

                <div className="person-card-skills">
                  {perfil.habilidades.map((habilidade) => (
                    <span key={habilidade.nome}>{habilidade.nome}</span>
                  ))}
                </div>

                <div className="person-card-footer">
                  <span>⌖ {perfil.cidade}</span>
                  <strong>Ver perfil</strong>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <div className="people-empty">
            <strong>Nenhum perfil encontrado</strong>
            <span>Tente buscar outro nome ou habilidade, ou remova o filtro.</span>
          </div>
        )}
      </div>
    </main>
  );
}

export default Habilidades;
