import { useMemo, useState } from "react";
import { listarPessoas } from "../api/pessoas.js";
import { descreverCurso, iniciais } from "../rotulos.js";
import { useCarregar } from "../useCarregar.js";
import { rotuloConexao, useConexoes } from "./useConexoes.js";

function Connections({ onAbrirConversa }) {
  const { dados: pessoas, carregando, erro: erroPessoas, recarregar } = useCarregar(listarPessoas, []);
  const { mapa, erro: erroPersistencia, alternar, recusar, conversar } = useConexoes(onAbrirConversa);
  const [aba, setAba] = useState("conexoes");
  const [busca, setBusca] = useState("");
  const [perfilAberto, setPerfilAberto] = useState(null);

  // A conexão traz só o resumo da pessoa; o diretório completa cidade, bio e habilidades.
  const pessoasPorId = useMemo(() => new Map(pessoas.map((pessoa) => [pessoa.id, pessoa])), [pessoas]);
  const pessoaDa = (conexao) => pessoasPorId.get(conexao.pessoa.id) || { ...conexao.pessoa, habilidades: [] };
  const todas = [...mapa.values()];
  const minhasConexoes = todas.filter((c) => c.status === "ACEITA").map(pessoaDa);
  const recebidas = todas.filter((c) => c.status === "PENDENTE" && !c.enviadaPorMim).map(pessoaDa);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pessoas;
    return pessoas.filter((pessoa) =>
      [pessoa.nome, descreverCurso(pessoa), ...pessoa.habilidades.map((h) => h.nome)]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, pessoas]);

  if (perfilAberto) {
    const conexao = mapa.get(perfilAberto.id);
    const conectado = conexao?.status === "ACEITA";

    return (
      <main className="connections-page">
        <div className="connections-container">
          <section className="connections-profile animate__animated animate__fadeIn">
            <button type="button" className="page-back-button connections-back" onClick={() => setPerfilAberto(null)}>← Voltar para pessoas</button>

            {erroPersistencia && <p className="connections-persistence-error" role="alert">{erroPersistencia}</p>}

            <div className="connections-profile-header">
              <div className="connections-profile-avatar">{iniciais(perfilAberto.nome)}</div>
              <div className="connections-profile-main">
                <span className="connections-label">PERFIL</span>
                <h1>{perfilAberto.nome}</h1>
                <p>{descreverCurso(perfilAberto)}</p>
                {perfilAberto.cidade && <span className="connections-profile-location">⌖ {perfilAberto.cidade}</span>}
              </div>
              <button type="button" className="connections-profile-connect" onClick={() => conversar(perfilAberto.id)}>Mensagem</button>
              <button type="button" className={`connections-profile-connect ${conectado ? "connected" : ""}`} onClick={() => alternar(perfilAberto.id)}>
                {rotuloConexao(conexao)}
              </button>
            </div>

            <div className="connections-profile-content">
              <section className="connections-profile-block">
                <span className="connections-label">SOBRE</span>
                <h2>Sobre {perfilAberto.nome.split(" ")[0]}</h2>
                <p>{perfilAberto.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
              </section>

              <section className="connections-profile-block">
                <span className="connections-label">HABILIDADES</span>
                <h2>Competências</h2>
                <div className="profile-skill-grid">
                  {perfilAberto.habilidades.map((habilidade, index) => (
                    <article className="profile-skill-card" key={habilidade.id}>
                      <span>0{index + 1}</span>
                      <strong>{habilidade.nome}</strong>
                      <small>{index === 0 ? "Principal" : "Competência"}</small>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="connections-page">
      <div className="connections-container">
        <section className="connections-hero animate__animated animate__fadeInDown">
          <div>
            <span className="connections-eyebrow">NETWORKING UNIVERSITÁRIO</span>
            <h1>Conexões</h1>
            <p>Construa sua rede, encontre pessoas com interesses em comum e mantenha contato com quem pode fazer parte dos seus próximos projetos.</p>
          </div>
          <div className="connections-count">
            <strong>{minhasConexoes.length}</strong>
            <span>conexões</span>
          </div>
        </section>

        <nav className="connections-tabs" aria-label="Seções de conexões">
          <button type="button" className={aba === "conexoes" ? "ativo" : ""} onClick={() => setAba("conexoes")}>
            <span>♧</span> Minhas conexões <b>{minhasConexoes.length}</b>
          </button>
          <button type="button" className={aba === "solicitacoes" ? "ativo" : ""} onClick={() => setAba("solicitacoes")}>
            <span>♢</span> Solicitações {recebidas.length > 0 && <b>{recebidas.length}</b>}
          </button>
          <button type="button" className={aba === "encontrar" ? "ativo" : ""} onClick={() => setAba("encontrar")}>
            <span>⌕</span> Encontrar pessoas
          </button>
        </nav>

        {erroPersistencia && <p className="connections-persistence-error" role="alert">{erroPersistencia}</p>}

        {aba === "conexoes" && (
          <section className="connections-section animate__animated animate__fadeInUp">
            <div className="connections-heading">
              <div>
                <span className="connections-label">MINHA REDE</span>
                <h2>Pessoas com quem você se conectou</h2>
              </div>
            </div>

            {minhasConexoes.length ? (
              <div className="connection-grid">
                {minhasConexoes.map((pessoa) => (
                  <article className="connection-card" key={pessoa.id}>
                    <div className="connection-card-top">
                      <div className="connection-avatar">{iniciais(pessoa.nome)}</div>
                      <div>
                        <h3>{pessoa.nome}</h3>
                        <p>{descreverCurso(pessoa)}</p>
                      </div>
                    </div>
                    <div className="connection-skills">
                      {pessoa.habilidades.map((item) => <span key={item.id}>{item.nome}</span>)}
                    </div>
                    <div className="connection-card-footer">
                      <span>{pessoa.cidade ? `⌖ ${pessoa.cidade}` : ""}</span>
                      <button type="button" onClick={() => alternar(pessoa.id)}>Desconectar</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="connections-empty">
                <div className="connections-empty-icon">♧</div>
                <strong>Sua rede ainda está começando</strong>
                <span>Encontre estudantes com habilidades que combinam com seus projetos e envie uma conexão.</span>
                <button type="button" onClick={() => setAba("encontrar")}>Encontrar pessoas</button>
              </div>
            )}
          </section>
        )}

        {aba === "solicitacoes" && (
          <section className="connections-section animate__animated animate__fadeInUp">
            <div className="connections-heading">
              <div>
                <span className="connections-label">AGUARDANDO SUA RESPOSTA</span>
                <h2>Solicitações recebidas</h2>
              </div>
              <span className="connections-result-count">{recebidas.length} pendente{recebidas.length === 1 ? "" : "s"}</span>
            </div>

            {recebidas.length ? (
              <div className="request-list">
                {recebidas.map((pessoa) => (
                  <article className="request-card" key={pessoa.id}>
                    <div className="connection-avatar">{iniciais(pessoa.nome)}</div>
                    <div className="request-info">
                      <h3>{pessoa.nome}</h3>
                      <p>{[descreverCurso(pessoa), pessoa.cidade].filter(Boolean).join(" · ")}</p>
                      <div className="connection-skills">{pessoa.habilidades.map((item) => <span key={item.id}>{item.nome}</span>)}</div>
                    </div>
                    <div className="request-actions">
                      <button type="button" className="accept" onClick={() => alternar(pessoa.id)}>Aceitar</button>
                      <button type="button" className="decline" onClick={() => recusar(pessoa.id)}>Recusar</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="connections-empty compact">
                <div className="connections-empty-icon">✓</div>
                <strong>Nenhuma solicitação pendente</strong>
                <span>Quando alguém quiser se conectar com você, a solicitação aparecerá aqui.</span>
              </div>
            )}
          </section>
        )}

        {aba === "encontrar" && (
          <section className="connections-section animate__animated animate__fadeInUp">
            <div className="connections-heading">
              <div>
                <span className="connections-label">AMPLIE SUA REDE</span>
                <h2>Encontre pessoas</h2>
              </div>
            </div>

            <label className="connections-search">
              <span>⌕</span>
              <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome, curso ou habilidade..." />
            </label>

            {carregando && <p className="connections-result-count" role="status">Carregando pessoas...</p>}
            {erroPessoas && (
              <div className="connections-empty compact" role="alert">
                <strong>Não foi possível carregar as pessoas</strong>
                <span>{erroPessoas}</span>
                <button type="button" onClick={recarregar}>Tentar novamente</button>
              </div>
            )}

            <div className="connection-grid discovery-grid">
              {filtradas.map((pessoa) => {
                const conexao = mapa.get(pessoa.id);
                const conectado = conexao?.status === "ACEITA";
                return (
                  <article
                    className="connection-card discovery-clickable"
                    key={pessoa.id}
                    onClick={() => setPerfilAberto(pessoa)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPerfilAberto(pessoa);
                      }
                    }}
                  >
                    <div className="connection-card-top">
                      <div className="connection-avatar">{iniciais(pessoa.nome)}</div>
                      <div>
                        <h3>{pessoa.nome}</h3>
                        <p>{descreverCurso(pessoa)}</p>
                      </div>
                    </div>
                    <div className="connection-skills">
                      {pessoa.habilidades.map((item) => <span key={item.id}>{item.nome}</span>)}
                    </div>
                    <div className="connection-card-footer">
                      <span>{pessoa.cidade ? `⌖ ${pessoa.cidade}` : ""}</span>
                      <button type="button" className={conectado ? "connected" : ""} onClick={(event) => { event.stopPropagation(); alternar(pessoa.id); }}>
                        {rotuloConexao(conexao)}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default Connections;
