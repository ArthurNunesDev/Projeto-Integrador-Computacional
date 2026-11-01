import { useEffect, useState } from "react";

import { listarAreas } from "../api/catalogos.js";
import { listarConexoes } from "../api/conexoes.js";
import { listarHabilidadesPublicadas } from "../api/habilidades.js";
import { listarParticipacoes } from "../api/oportunidades.js";
import { listarPessoas } from "../api/pessoas.js";
import { calcularProgressoPerfil, conquistaPerfilExibida, marcarConquistaPerfilExibida } from "../perfil.js";
import { iniciais } from "../rotulos.js";
import { useCarregar } from "../useCarregar.js";
import { carregarOportunidades, useAcoesOportunidade } from "./acoesOportunidade.js";

// Números do painel e da barra lateral, todos calculados a partir das listas da API.
function carregarPainel() {
  return Promise.all([listarHabilidadesPublicadas(), listarPessoas(), listarConexoes(), listarParticipacoes()])
    .then(([habilidades, pessoas, conexoes, participacoes]) => ({
      habilidades,
      pessoas: pessoas.length,
      conexoes: conexoes.length,
      participacoes: participacoes.length,
    }));
}

// As 5 categorias com mais habilidades publicadas.
function categoriasEmDestaque(habilidades) {
  const contagem = new Map();
  habilidades.forEach((h) => contagem.set(h.categoria, (contagem.get(h.categoria) || 0) + 1));
  return [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function Body({ onNavigate, usuario }) {
  const nomeUsuario = usuario?.nome || "";
  const iniciaisUsuario = iniciais(nomeUsuario, "US");
  const [areaSelecionada, setAreaSelecionada] = useState("Todos");
  const [detalheId, setDetalheId] = useState(null);
  const { dados: oportunidades, carregando: carregandoOportunidades, erro: erroOportunidades, setDados } = useCarregar(carregarOportunidades, []);
  const { dados: listaAreas } = useCarregar(listarAreas, []);
  const { dados: painel } = useCarregar(carregarPainel);
  const { erro: erroAcao, alternar } = useAcoesOportunidade(setDados);

  const minhasHabilidades = painel ? painel.habilidades.filter((h) => h.usuario?.id === usuario?.id).length : 0;
  const perfilProgresso = calcularProgressoPerfil(usuario, minhasHabilidades);
  // A conquista é permanente por conta: depois de registrada o card não volta.
  const perfilConcluido = conquistaPerfilExibida(usuario) || perfilProgresso === 100;

  useEffect(() => {
    if (painel && perfilProgresso === 100) marcarConquistaPerfilExibida(usuario);
  }, [painel, perfilProgresso, usuario]);

  const areas = ["Todos", ...listaAreas.map((area) => area.nome)];
  const oportunidadesFiltradas = oportunidades
    .filter((item) => areaSelecionada === "Todos" || item.areas.includes(areaSelecionada))
    .slice(0, 4);
  const detalheAberto = oportunidades.find((item) => item.id === detalheId) || null;
  const abertas = oportunidades.filter((item) => item.status === "ABERTA").length;
  const destaque = painel ? categoriasEmDestaque(painel.habilidades) : [];

  return (
    <main className="main-content">
      {erroAcao && <p className="home-storage-error" role="alert">{erroAcao}</p>}
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
              <strong>{painel ? painel.pessoas + 1 : "–"}</strong>

              <span>Estudantes ativos</span>

              <small>com perfil público</small>
            </div>

            <div className="stat-card animate__animated animate__zoomIn">
              <strong>{carregandoOportunidades ? "–" : abertas}</strong>

              <span>Oportunidades abertas</span>

              <small>de {oportunidades.length} publicadas</small>
            </div>

            <div className="stat-card animate__animated animate__zoomIn">
              <strong>{painel ? painel.habilidades.length : "–"}</strong>

              <span>Habilidades disponíveis</span>

              <small>publicadas por estudantes</small>
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

            {carregandoOportunidades ? (
              <div className="opportunities-empty-home" role="status">
                <strong>Carregando oportunidades...</strong>
              </div>
            ) : erroOportunidades ? (
              <div className="opportunities-empty-home" role="alert">
                <strong>Não foi possível carregar as oportunidades</strong>
                <span>{erroOportunidades}</span>
              </div>
            ) : oportunidadesFiltradas.length > 0 ? (
              <div className="opportunities-grid">
                {oportunidadesFiltradas.map((item) => {
                  return (
                    <article className="opportunity-card animate__animated animate__fadeInUp" key={item.id}>
                      <button
                        className={item.salva ? "save-button save-button-home salvo" : "save-button save-button-home"}
                        type="button"
                        onClick={() => alternar(item, "salva")}
                        aria-label={item.salva ? "Remover dos salvos" : "Salvar oportunidade"}
                      >
                        {item.salva ? "♥" : "♡"}
                      </button>
                      <button className="opportunity-card-open" type="button" onClick={() => setDetalheId(item.id)} aria-label={"Ver detalhes de " + item.titulo}>
                        <div className="opportunity-top">
                          <div className="opportunity-icon">{item.icon}</div>
                          <div className="opportunity-top-actions">
                            <span className="opportunity-type">{item.tipo}</span>
                          </div>
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
                          <button className="details-button" type="button" onClick={() => setDetalheId(item.id)}>Detalhes</button>
                          <BotaoParticipar item={item} usuarioId={usuario?.id} onAlternar={alternar} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="opportunities-empty-home">
                <strong>{oportunidades.length ? "Nenhuma oportunidade nesta área" : "Ainda não há oportunidades publicadas"}</strong>
                <span>{oportunidades.length ? "Escolha outra área para continuar explorando." : "Quando alguém publicar, ela aparecerá aqui."}</span>
              </div>
            )}
          </section>
        </section>

        <aside className="dashboard-sidebar">
          {/* PERFIL */}
          <section className="profile-card animate__animated animate__fadeInRight">
            <div className="profile-avatar">{iniciaisUsuario}</div>

            <h3>{nomeUsuario}</h3>

            <p>{[usuario?.curso || "Curso não informado", usuario?.periodo?.replace(/\s*período$/i, " per.")].filter(Boolean).join(" · ")}</p>

            <div className="profile-stats">
              <div>
                <strong>{painel?.conexoes ?? "–"}</strong>
                <span>Conexões</span>
              </div>

              <div>
                <strong>{painel?.participacoes ?? "–"}</strong>
                <span>Projetos</span>
              </div>

              <div>
                <strong>{painel ? minhasHabilidades : "–"}</strong>
                <span>Skills</span>
              </div>
            </div>
          </section>

          {/* COMPLETAR PERFIL */}
          {painel && !perfilConcluido && (
            <section className="complete-card">
              <h3>✨ Complete seu perfil</h3>
              <div className="progress-bar"><span style={{ width: perfilProgresso + "%" }}></span></div>
              <strong>{perfilProgresso}% concluído</strong>
              <p>Adicione suas informações e habilidades!</p>
              <button type="button" onClick={() => onNavigate?.("perfil")}>Completar perfil →</button>
            </section>
          )}

          {/* CATEGORIAS EM DESTAQUE */}
          <section className="popular-card">
            <h3>🔥 Categorias com mais habilidades</h3>

            <ol>
              {destaque.length ? destaque.map(([categoria, total], index) => (
                <li key={categoria}>
                  <span>{index + 1}</span>
                  <strong>{categoria}</strong>
                  <small>{total} {total === 1 ? "habilidade" : "habilidades"}</small>
                </li>
              )) : (
                <li>
                  <span>–</span>
                  <strong>{painel ? "Nenhuma habilidade publicada ainda" : "Carregando..."}</strong>
                </li>
              )}
            </ol>
          </section>
        </aside>
      </div>

      {detalheAberto && (
        <div className="opportunity-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setDetalheId(null);
        }}>
          <section className="opportunity-modal animate__animated animate__fadeInUp" role="dialog" aria-modal="true">
            <button className="opportunity-modal-close" type="button" onClick={() => setDetalheId(null)} aria-label="Fechar detalhes">×</button>
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
              <button className={detalheAberto.salva ? "save-button save-button-modal salvo" : "save-button save-button-modal"} type="button" onClick={() => alternar(detalheAberto, "salva")}>{detalheAberto.salva ? "♥ Salvo" : "♡ Salvar"}</button>
              <BotaoParticipar item={detalheAberto} usuarioId={usuario?.id} onAlternar={alternar} />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

// Participar/sair; desabilitado na própria oportunidade e nas encerradas.
function BotaoParticipar({ item, usuarioId, onAlternar }) {
  if (item.autorId === usuarioId) return <button type="button" disabled>Sua oportunidade</button>;
  if (item.status === "FECHADA" && !item.participando) return <button type="button" disabled>Encerrada</button>;
  return (
    <button className={item.participando ? "participating-button" : ""} type="button" onClick={() => onAlternar(item, "participando")}>
      {item.participando ? "✓ Participando" : "Participar"}
    </button>
  );
}

export default Body;
