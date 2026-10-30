import { useMemo, useState } from "react";
import { listarPessoas } from "../api/pessoas.js";
import { descreverCurso, iniciais, NIVEIS } from "../rotulos.js";
import { useCarregar } from "../useCarregar.js";
import { rotuloConexao, useConexoes } from "./useConexoes.js";

function Habilidades({ onAbrirConversa }) {
  const { dados: perfis, carregando, erro: erroPerfis, recarregar } = useCarregar(listarPessoas, []);
  const { mapa: conexoes, erro: erroPersistencia, alternar: alternarConexao, conversar } = useConexoes(onAbrirConversa);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState(null);
  const perfilSelecionado = perfis.find((perfil) => perfil.id === perfilSelecionadoId);

  const categorias = useMemo(
    () => ["Todas", ...new Set(perfis.flatMap((perfil) => perfil.habilidades.map((habilidade) => habilidade.categoria)))],
    [perfis],
  );

  const perfisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return perfis.filter((perfil) => {
      const correspondeBusca =
        !termo ||
        perfil.nome.toLowerCase().includes(termo) ||
        descreverCurso(perfil).toLowerCase().includes(termo) ||
        perfil.habilidades.some((habilidade) =>
          habilidade.nome.toLowerCase().includes(termo),
        );

      const correspondeCategoria =
        categoria === "Todas" ||
        perfil.habilidades.some((habilidade) => habilidade.categoria === categoria);

      return correspondeBusca && correspondeCategoria;
    });
  }, [perfis, busca, categoria]);

  if (perfilSelecionado) {
    const conexao = conexoes.get(perfilSelecionado.id);

    return (
      <main className="people-skills-page">
        <div className="people-skills-container">
          <button className="page-back-button people-back-button" type="button" onClick={() => setPerfilSelecionadoId(null)}>
            ← Voltar para Habilidades
          </button>

          <section className="person-profile-header animate__animated animate__fadeInDown">
            <div className="person-profile-avatar">{iniciais(perfilSelecionado.nome)}</div>
            <div className="person-profile-main">
              <span className="people-eyebrow">PERFIL DO ESTUDANTE</span>
              <h1>{perfilSelecionado.nome}</h1>
              <p>{descreverCurso(perfilSelecionado)}</p>
              {perfilSelecionado.cidade && <span className="person-location">⌖ {perfilSelecionado.cidade}</span>}
            </div>
            {erroPersistencia && <p className="people-persistence-error" role="alert">{erroPersistencia}</p>}
            <button className="connect-button" type="button" onClick={() => conversar(perfilSelecionado.id)}>
              Mensagem
            </button>
            <button
              className={conexao?.status === "ACEITA" ? "connect-button conectado" : "connect-button"}
              type="button"
              onClick={() => alternarConexao(perfilSelecionado.id)}
            >
              {rotuloConexao(conexao)}
            </button>
          </section>

          <section className="person-about animate__animated animate__fadeInUp">
            <span className="people-section-label">SOBRE</span>
            <p>{perfilSelecionado.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
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
                <article className="person-skill-card" key={habilidade.id}>
                  <div className="person-skill-icon">✦</div>
                  <div>
                    <span>{habilidade.categoria}</span>
                    <h3>{habilidade.nome}</h3>
                    <p>Nível {NIVEIS[habilidade.nivel] || habilidade.nivel}</p>
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

        {carregando ? (
          <div className="people-empty" role="status"><strong>Carregando perfis...</strong></div>
        ) : erroPerfis ? (
          <div className="people-empty" role="alert">
            <strong>Não foi possível carregar os perfis</strong>
            <span>{erroPerfis}</span>
            <button type="button" className="people-filter" onClick={recarregar}>Tentar novamente</button>
          </div>
        ) : perfisFiltrados.length ? (
          <section className="people-grid">
            {perfisFiltrados.map((perfil, index) => (
              <button
                type="button"
                className="person-card animate__animated animate__fadeInUp"
                style={{ animationDelay: `${index * 70}ms` }}
                key={perfil.id}
                onClick={() => setPerfilSelecionadoId(perfil.id)}
              >
                <div className="person-card-header">
                  <div className="person-card-avatar">{iniciais(perfil.nome)}</div>
                  <div className="person-card-identity">
                    <h3>{perfil.nome}</h3>
                    <p>{descreverCurso(perfil)}</p>
                  </div>
                  <span className="person-card-arrow">→</span>
                </div>

                <p className="person-card-bio">{perfil.bio}</p>

                <div className="person-card-skills">
                  {perfil.habilidades.map((habilidade) => (
                    <span key={habilidade.id}>{habilidade.nome}</span>
                  ))}
                </div>

                <div className="person-card-footer">
                  <span>{perfil.cidade ? `⌖ ${perfil.cidade}` : ""}</span>
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
