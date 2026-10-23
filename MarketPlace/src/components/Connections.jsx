import { useMemo, useState } from "react";
import { chaveUsuario, lerValorSeguro, salvarValorSeguro } from "../storage.js";

const CHAVE_CONEXOES = "marketfaesa-conexoes";

const pessoas = [
  { id: 1, nome: "Ana Souza", curso: "Ciência da Computação · 6º período", cidade: "Vitória, ES", inicial: "AS", bio: "Desenvolvedora front-end interessada em interfaces acessíveis e projetos colaborativos.", habilidades: ["React", "JavaScript", "UX/UI Design"] },
  { id: 2, nome: "Lucas Martins", curso: "Design · 5º período", cidade: "Vila Velha, ES", inicial: "LM", bio: "Designer focado em identidade visual, prototipação e experiências digitais.", habilidades: ["Figma", "UI Design", "Branding"] },
  { id: 3, nome: "Rafael Costa", curso: "Direito · 7º período", cidade: "Vitória, ES", inicial: "RC", bio: "Estudante de Direito interessado em pesquisa, contratos e produção de conteúdo jurídico.", habilidades: ["Redação Jurídica", "Contratos", "Pesquisa"] },
  { id: 4, nome: "Marina Oliveira", curso: "Administração · 4º período", cidade: "Serra, ES", inicial: "MO", bio: "Estudante de Administração apaixonada por dados, marketing e organização de projetos.", habilidades: ["Excel", "Marketing Digital", "Análise de Dados"] },
];

function obterConexoes(chave) {
  try {
    const salvo = lerValorSeguro(chave);
    const ids = salvo ? JSON.parse(salvo) : [];
    if (!Array.isArray(ids)) return [];

    const idsConhecidos = new Set(pessoas.map((pessoa) => pessoa.id));
    return [...new Set(ids.filter((id) => idsConhecidos.has(id)))];
  } catch {
    return [];
  }
}

function obterSolicitacoes(chave) {
  try {
    const salvo = lerValorSeguro(chave);
    const dados = salvo ? JSON.parse(salvo) : [];
    if (!Array.isArray(dados)) return [];

    // Usa os perfis conhecidos para evitar que registros incompletos quebrem a tela.
    const idsConhecidos = new Set(pessoas.map((pessoa) => pessoa.id));
    const idsValidos = dados
      .filter((item) => item && typeof item === "object" && !Array.isArray(item))
      .map((item) => item.id)
      .filter((id) => idsConhecidos.has(id));
    return [...new Set(idsValidos)].map((id) => pessoas.find((pessoa) => pessoa.id === id));
  } catch {
    return [];
  }
}

function Connections({ usuarioId }) {
  const chaveConexoes = chaveUsuario(CHAVE_CONEXOES, usuarioId);
  const chaveRecebidas = chaveUsuario("marketfaesa-solicitacoes-recebidas", usuarioId);
  const [aba, setAba] = useState("conexoes");
  const [busca, setBusca] = useState("");
  const [conexoes, setConexoes] = useState(() => obterConexoes(chaveConexoes));
  const [recebidas, setRecebidas] = useState(() => obterSolicitacoes(chaveRecebidas));
  const [perfilAberto, setPerfilAberto] = useState(null);
  const [erroPersistencia, setErroPersistencia] = useState("");

  function salvarConexoes(ids) {
    if (!salvarValorSeguro(chaveConexoes, JSON.stringify(ids))) {
      setErroPersistencia("Não foi possível salvar as conexões neste navegador. Tente novamente.");
      return false;
    }
    setConexoes(ids);
    setErroPersistencia("");
    return true;
  }

  function salvarSolicitacoes(lista) {
    if (!salvarValorSeguro(chaveRecebidas, JSON.stringify(lista))) {
      setErroPersistencia("Não foi possível salvar as solicitações neste navegador. Tente novamente.");
      return false;
    }
    setRecebidas(lista);
    setErroPersistencia("");
    return true;
  }

  function conectar(id) {
    salvarConexoes([...new Set([...conexoes, id])]);
  }

  function removerConexao(id) {
    salvarConexoes(conexoes.filter((item) => item !== id));
  }

  function aceitarSolicitacao(pessoa) {
    const novasConexoes = [...new Set([...conexoes, pessoa.id])];
    const novasSolicitacoes = recebidas.filter((item) => item.id !== pessoa.id);
    if (!salvarValorSeguro(chaveConexoes, JSON.stringify(novasConexoes))) {
      setErroPersistencia("Não foi possível aceitar a solicitação porque as conexões não puderam ser salvas.");
      return;
    }
    if (!salvarValorSeguro(chaveRecebidas, JSON.stringify(novasSolicitacoes))) {
      setErroPersistencia("A conexão foi salva, mas não foi possível atualizar as solicitações. Tente novamente.");
      setConexoes(novasConexoes);
      return;
    }
    setConexoes(novasConexoes);
    setRecebidas(novasSolicitacoes);
    setErroPersistencia("");
  }

  function recusarSolicitacao(id) {
    salvarSolicitacoes(recebidas.filter((item) => item.id !== id));
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

  if (perfilAberto) {
    const conectado = conexoes.includes(perfilAberto.id);

    return (
      <main className="connections-page">
        <div className="connections-container">
          <section className="connections-profile animate__animated animate__fadeIn">
            <button type="button" className="page-back-button connections-back" onClick={() => setPerfilAberto(null)}>← Voltar para pessoas</button>

            {erroPersistencia && <p className="connections-persistence-error" role="alert">{erroPersistencia}</p>}

            <div className="connections-profile-header">
              <div className="connections-profile-avatar">{perfilAberto.inicial}</div>
              <div className="connections-profile-main">
                <span className="connections-label">PERFIL</span>
                <h1>{perfilAberto.nome}</h1>
                <p>{perfilAberto.curso}</p>
                <span className="connections-profile-location">⌖ {perfilAberto.cidade}</span>
              </div>
              <button type="button" className={`connections-profile-connect ${conectado ? "connected" : ""}`} onClick={() => conectado ? removerConexao(perfilAberto.id) : conectar(perfilAberto.id)}>
                {conectado ? "✓ Conectado" : "+ Conectar"}
              </button>
            </div>

            <div className="connections-profile-content">
              <section className="connections-profile-block">
                <span className="connections-label">SOBRE</span>
                <h2>Sobre {perfilAberto.nome.split(" ")[0]}</h2>
                <p>{perfilAberto.bio}</p>
              </section>

              <section className="connections-profile-block">
                <span className="connections-label">HABILIDADES</span>
                <h2>Competências</h2>
                <div className="profile-skill-grid">
                  {perfilAberto.habilidades.map((habilidade, index) => (
                    <article className="profile-skill-card" key={habilidade}>
                      <span>0{index + 1}</span>
                      <strong>{habilidade}</strong>
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
                      <button type="button" className={conectado ? "connected" : ""} onClick={(event) => { event.stopPropagation(); conectado ? removerConexao(pessoa.id) : conectar(pessoa.id); }}>
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
