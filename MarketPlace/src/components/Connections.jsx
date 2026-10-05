import { useMemo, useState } from "react";

const CHAVE_CONEXOES = "marketfaesa-conexoes";

const pessoas = [
  { id: 1, nome: "Ana Souza", curso: "Ciência da Computação · 6º período", cidade: "Vitória, ES", inicial: "AS", habilidades: ["React", "JavaScript", "UX/UI Design"] },
  { id: 2, nome: "Lucas Martins", curso: "Design · 5º período", cidade: "Vila Velha, ES", inicial: "LM", habilidades: ["Figma", "UI Design", "Branding"] },
  { id: 3, nome: "Rafael Costa", curso: "Direito · 7º período", cidade: "Vitória, ES", inicial: "RC", habilidades: ["Redação Jurídica", "Contratos", "Pesquisa"] },
  { id: 4, nome: "Marina Oliveira", curso: "Administração · 4º período", cidade: "Serra, ES", inicial: "MO", habilidades: ["Excel", "Marketing Digital", "Análise de Dados"] },
];

const solicitacoesRecebidas = [
  { id: 5, nome: "Beatriz Almeida", curso: "Publicidade · 6º período", cidade: "Vitória, ES", inicial: "BA", habilidades: ["Social Media", "Copywriting", "Canva"] },
  { id: 6, nome: "Pedro Henrique", curso: "Engenharia de Software · 5º período", cidade: "Vila Velha, ES", inicial: "PH", habilidades: ["Java", "Spring", "Git"] },
];

function obterConexoes() {
  try {
    const salvo = localStorage.getItem(CHAVE_CONEXOES);
    const ids = salvo ? JSON.parse(salvo) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function Connections() {
  const [aba, setAba] = useState("conexoes");
  const [busca, setBusca] = useState("");
  const [conexoes, setConexoes] = useState(obterConexoes);
  const [recebidas, setRecebidas] = useState(solicitacoesRecebidas);

  function salvarConexoes(ids) {
    setConexoes(ids);
    localStorage.setItem(CHAVE_CONEXOES, JSON.stringify(ids));
  }

  function conectar(id) {
    salvarConexoes([...new Set([...conexoes, id])]);
  }

  function removerConexao(id) {
    salvarConexoes(conexoes.filter((item) => item !== id));
  }

  function aceitarSolicitacao(pessoa) {
    conectar(pessoa.id);
    setRecebidas((estado) => estado.filter((item) => item.id !== pessoa.id));
  }

  function recusarSolicitacao(id) {
    setRecebidas((estado) => estado.filter((item) => item.id !== id));
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pessoas;
    return pessoas.filter((pessoa) =>
      [pessoa.nome, pessoa.curso, ...pessoa.habilidades]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca]);

  const minhasConexoes = pessoas.filter((pessoa) => conexoes.includes(pessoa.id));

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
                      <div className="connection-avatar">{pessoa.inicial}</div>
                      <div>
                        <h3>{pessoa.nome}</h3>
                        <p>{pessoa.curso}</p>
                      </div>
                    </div>
                    <div className="connection-skills">
                      {pessoa.habilidades.map((item) => <span key={item}>{item}</span>)}
                    </div>
                    <div className="connection-card-footer">
                      <span>⌖ {pessoa.cidade}</span>
                      <button type="button" onClick={() => removerConexao(pessoa.id)}>Desconectar</button>
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
                    <div className="connection-avatar">{pessoa.inicial}</div>
                    <div className="request-info">
                      <h3>{pessoa.nome}</h3>
                      <p>{pessoa.curso} · {pessoa.cidade}</p>
                      <div className="connection-skills">{pessoa.habilidades.map((item) => <span key={item}>{item}</span>)}</div>
                    </div>
                    <div className="request-actions">
                      <button type="button" className="accept" onClick={() => aceitarSolicitacao(pessoa)}>Aceitar</button>
                      <button type="button" className="decline" onClick={() => recusarSolicitacao(pessoa.id)}>Recusar</button>
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

            <div className="connection-grid discovery-grid">
              {filtradas.map((pessoa) => {
                const conectado = conexoes.includes(pessoa.id);
                return (
                  <article className="connection-card" key={pessoa.id}>
                    <div className="connection-card-top">
                      <div className="connection-avatar">{pessoa.inicial}</div>
                      <div>
                        <h3>{pessoa.nome}</h3>
                        <p>{pessoa.curso}</p>
                      </div>
                    </div>
                    <div className="connection-skills">
                      {pessoa.habilidades.map((item) => <span key={item}>{item}</span>)}
                    </div>
                    <div className="connection-card-footer">
                      <span>⌖ {pessoa.cidade}</span>
                      <button type="button" className={conectado ? "connected" : ""} onClick={() => conectado ? removerConexao(pessoa.id) : conectar(pessoa.id)}>
                        {conectado ? "✓ Conectado" : "+ Conectar"}
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
