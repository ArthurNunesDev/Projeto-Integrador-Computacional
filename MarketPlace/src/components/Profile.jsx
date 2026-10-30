import { useCallback, useState } from "react";

import { listarCursos } from "../api/catalogos.js";
import { listarConexoes } from "../api/conexoes.js";
import { listarHabilidadesPublicadas } from "../api/habilidades.js";
import { listarParticipacoes } from "../api/oportunidades.js";
import { calcularProgressoPerfil, conquistaPerfilExibida, formatarPeriodo, marcarConquistaPerfilExibida } from "../perfil.js";
import { iniciais, PERIODOS } from "../rotulos.js";
import { useCarregar } from "../useCarregar.js";

function obterPerfil(usuario) {
  return {
    nome: usuario?.nome || "",
    cursoId: usuario?.cursoId ?? "",
    periodo: usuario?.periodoNumero ?? "",
    cidade: usuario?.cidade || "",
    bio: usuario?.bio || "",
  };
}

const RESUMO_VAZIO = { habilidades: [], conexoes: 0, oportunidades: 0 };

function Perfil({ onNavigate, perfilPublico, mostrarEmail, usuario, onUpdateUsuario }) {
  const usuarioId = usuario?.id;
  const carregarResumo = useCallback(
    () => Promise.all([listarHabilidadesPublicadas({ usuarioId }), listarConexoes(), listarParticipacoes()])
      .then(([habilidades, conexoes, participacoes]) => ({
        habilidades,
        conexoes: conexoes.length,
        oportunidades: participacoes.length,
      })),
    [usuarioId],
  );
  const { dados: resumo } = useCarregar(carregarResumo, RESUMO_VAZIO);
  const { dados: cursos } = useCarregar(listarCursos, []);
  const habilidades = resumo.habilidades;
  const interesses = [...new Set(habilidades.map((habilidade) => habilidade.categoria).filter(Boolean))];
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [dados, setDados] = useState(() => obterPerfil(usuario));
  const [salvo, setSalvo] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [mostrarConquista, setMostrarConquista] = useState(false);
  const [erroFoto, setErroFoto] = useState("");
  const fotoPerfil = usuario?.fotoUrl || "";

  function mostrarSalvo() {
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);
  }

  // A foto vai como data URL no PUT /api/usuarios/me (fotoUrl).
  function alterarFoto(event) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErroFoto("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 1024 * 1024) {
      setErroFoto("A imagem deve ter no máximo 1 MB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => salvarFoto(typeof leitor.result === "string" ? leitor.result : "");
    leitor.onerror = () => setErroFoto("Não foi possível ler essa imagem. Tente outro arquivo.");
    leitor.readAsDataURL(arquivo);
  }

  async function salvarFoto(imagem) {
    const resultado = await onUpdateUsuario({ fotoUrl: imagem || null });
    if (!resultado?.sucesso) {
      setErroFoto(resultado?.mensagem || "Não foi possível salvar a foto. Tente uma imagem menor.");
      return;
    }
    setErroFoto("");
    if (imagem) mostrarSalvo();
  }

  function alterarCampo(campo, valor) {
    setDados((estado) => ({ ...estado, [campo]: valor }));
    setSalvo(false);
    setErroPerfil("");
  }

  async function salvarPerfil() {
    const nome = dados.nome.trim();
    if (!nome) {
      setErroPerfil("Informe seu nome completo antes de salvar.");
      return;
    }

    // O e-mail é o login e não muda por aqui.
    const cursoId = dados.cursoId === "" ? null : Number(dados.cursoId);
    const periodo = dados.periodo === "" ? null : Number(dados.periodo);
    setSalvando(true);
    const resultado = await onUpdateUsuario({ nome, cursoId, periodo, cidade: dados.cidade, bio: dados.bio });
    setSalvando(false);
    if (!resultado?.sucesso) {
      setErroPerfil(resultado?.mensagem || "Não foi possível salvar as alterações. Tente novamente.");
      setSalvo(false);
      return;
    }

    setEditando(false);
    setErroPerfil("");
    mostrarSalvo();

    const usuarioAtualizado = {
      ...usuario,
      nome,
      curso: cursos.find((curso) => curso.id === cursoId)?.nome || "",
      periodo: formatarPeriodo(periodo),
      cidade: dados.cidade,
      bio: dados.bio,
    };
    const progressoFinal = calcularProgressoPerfil(usuarioAtualizado, habilidades.length);
    if (progressoFinal === 100 && !conquistaPerfilExibida(usuarioAtualizado)) {
      marcarConquistaPerfilExibida(usuarioAtualizado);
      setMostrarConquista(true);
      window.setTimeout(() => setMostrarConquista(false), 4200);
    }
  }

  function cancelarEdicao() {
    setDados(obterPerfil(usuario));
    setEditando(false);
    setSalvo(false);
    setErroPerfil("");
  }

  return (
    <main className="perfil-page">
      <div className="perfil-container">
        <section className="perfil-page-header animate__animated animate__fadeInDown">
          <div><span className="perfil-eyebrow">MINHA CONTA</span><h1>Meu Perfil</h1><p>Gerencie suas informações e apresente suas habilidades para outros estudantes.</p></div>
          <button className="page-back-button perfil-back-button" type="button" onClick={() => onNavigate("inicio")}>← Voltar ao início</button>
        </section>

        {salvo && <div className="perfil-save-feedback" role="status">✓ Perfil atualizado e salvo</div>}
        {erroPerfil && <div className="perfil-form-error" role="alert">{erroPerfil}</div>}

        {mostrarConquista && (
          <div className="perfil-completo-overlay" role="dialog" aria-modal="true">
            <div className="perfil-completo-card">
              <div className="perfil-completo-icon">🎉</div>
              <span>PERFIL COMPLETO!</span>
              <h2>Obrigado por completar seu perfil! ✨</h2>
              <p>Agora sua presença na MarketFAESA está pronta para conectar você a novas oportunidades.</p>
              <div className="perfil-completo-sparkles">✦{"\u3000"}✧{"\u3000"}✦</div>
            </div>
          </div>
        )}

        <section className="perfil-main-card animate__animated animate__fadeInUp">
          <div className="perfil-main-top">
            <div className="perfil-avatar-area">
              <div className="perfil-avatar-large">
                {fotoPerfil ? <img src={fotoPerfil} alt={`Foto de perfil de ${usuario.nome || "usuário"}`} /> : iniciais(usuario.nome, "US")}
              </div>
              <div className="perfil-photo-actions">
                <label className="perfil-photo-upload">
                  {fotoPerfil ? "Alterar foto" : "Adicionar foto"}
                  <input type="file" accept="image/*" onChange={alterarFoto} aria-label="Escolher foto de perfil" />
                </label>
                {fotoPerfil && <button className="perfil-photo-remove" type="button" onClick={() => salvarFoto("")}>Remover</button>}
                <span className="perfil-photo-optional">Opcional</span>
              </div>
              {erroFoto && <p className="perfil-photo-error" role="alert">{erroFoto}</p>}
            </div>
            <div className="perfil-main-info">
              {editando ? (
                <label className="perfil-edit-field">
                  <span>Nome completo</span>
                  <input className="perfil-name-input" autoComplete="name" value={dados.nome} onChange={(e) => alterarCampo("nome", e.target.value)} placeholder="Digite seu nome completo" />
                </label>
              ) : (
                <h2>{usuario.nome} <span className={"perfil-visibility-badge " + (perfilPublico ? "" : "is-privado")}>{perfilPublico ? "🌐 Público" : "🔒 Privado"}</span></h2>
              )}
              {editando ? (
                <label className="perfil-edit-field">
                  <span>Curso</span>
                  <select className="perfil-inline-input" value={dados.cursoId} onChange={(e) => alterarCampo("cursoId", e.target.value)}>
                    <option value="">Curso não informado</option>
                    {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nome}</option>)}
                  </select>
                </label>
              ) : <span>{usuario.curso || "Curso não informado"}</span>}
              <div className={"perfil-meta" + (editando ? " perfil-meta-editando" : "")}>
                {editando ? (
                  <>
                    <label className="perfil-edit-field">
                      <span>Período / semestre</span>
                      <select className="perfil-inline-input small" value={dados.periodo} onChange={(e) => alterarCampo("periodo", e.target.value)}>
                        <option value="">Não informado</option>
                        {PERIODOS.map((periodo) => <option key={periodo} value={periodo}>{formatarPeriodo(periodo)}</option>)}
                      </select>
                    </label>
                    <label className="perfil-edit-field">
                      <span>Cidade</span>
                      <input className="perfil-inline-input small" value={dados.cidade} onChange={(e) => alterarCampo("cidade", e.target.value)} placeholder="Ex.: Vitória - ES" maxLength={120} />
                    </label>
                  </>
                ) : <>
                  <span>🎓 {usuario.periodo || "Período não informado"}</span>
                  <span>📍 {usuario.cidade || "Cidade não informada"}</span>
                </>}
              </div>
            </div>
            <div className="perfil-actions">
              {editando ? <>
                <button className="perfil-button secondary" type="button" onClick={cancelarEdicao}>Cancelar</button>
                <button className="perfil-button primary" type="button" onClick={salvarPerfil} disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</button>
              </> : <button className="perfil-button primary" type="button" onClick={() => { setDados(obterPerfil(usuario)); setEditando(true); }}>✎ Editar perfil</button>}
            </div>
          </div>

          <div className="perfil-statistics">
            <div className="perfil-stat"><strong>{resumo.conexoes}</strong><span>Conexões</span></div>
            <div className="perfil-stat"><strong>{resumo.oportunidades}</strong><span>Oportunidades</span></div>
            <div className="perfil-stat"><strong>{habilidades.length}</strong><span>Publicações</span></div>
            <div className="perfil-stat"><strong>{new Set(habilidades.map((habilidade) => habilidade.nome)).size}</strong><span>Habilidades</span></div>
          </div>
        </section>

        <div className="perfil-grid">
          <div className="perfil-column-main">
            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>PERFIL</span><h3>Sobre mim</h3></div></div>
              {editando ? (
                <label className="perfil-edit-field perfil-bio-edit-field">
                  <span>Sobre você</span>
                  <textarea className="perfil-bio-input" value={dados.bio} onChange={(e) => alterarCampo("bio", e.target.value)} rows={5} maxLength={1000} placeholder="Conte um pouco sobre você, seus interesses e objetivos." />
                  <small>Apresente-se para outros estudantes. Este campo ajuda a personalizar seu perfil.</small>
                </label>
              ) : <p className="perfil-bio">{usuario.bio || "Você ainda não adicionou uma descrição."}</p>}
            </section>

            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>COMPETÊNCIAS</span><h3>Minhas habilidades</h3></div><button className="perfil-section-link" type="button" onClick={() => onNavigate("publicar-habilidade")}>+ Adicionar</button></div>
              <div className="perfil-skills">
                {habilidades.length ? habilidades.map((habilidade) => <span className="perfil-skill" key={habilidade.id}>{habilidade.nome}</span>) : <p className="perfil-bio">Você ainda não publicou habilidades.</p>}
              </div>
            </section>

            <section className="perfil-section-card animate__animated animate__fadeInUp">
              <div className="perfil-section-heading"><div><span>INTERESSES</span><h3>Áreas de interesse</h3></div></div>
              <div className="perfil-interests">
                {interesses.length ? interesses.map((interesse) => <div className="perfil-interest" key={interesse}><span className="perfil-interest-icon">✓</span><span>{interesse}</span></div>) : <p className="perfil-bio">Suas áreas de interesse aparecerão conforme você publicar habilidades.</p>}
              </div>
            </section>
          </div>

          <aside className="perfil-column-side">
            <section className="perfil-side-card animate__animated animate__fadeInRight">
              <div className="perfil-side-title"><h3>Informações</h3></div>
              <div className="perfil-information">
                <div className="perfil-information-item"><span>E-mail</span>{editando || mostrarEmail ? <strong>{usuario.email}</strong> : <strong className="perfil-info-oculto">Oculto · ative em Configurações</strong>}</div>
                <div className="perfil-information-item"><span>Curso</span><strong>{usuario.curso}</strong></div>
                <div className="perfil-information-item"><span>Período</span><strong>{usuario.periodo}</strong></div>
                <div className="perfil-information-item"><span>Localização</span><strong>{usuario.cidade}</strong></div>
              </div>
            </section>

            <PerfilConclusao usuario={usuario} quantidadeHabilidades={habilidades.length} onNavigate={onNavigate} />

            <section className="perfil-side-card perfil-quick-actions">
              <h3>Acesso rápido</h3>
              <button type="button" onClick={() => onNavigate("publicacoes")}>♡<span>Minhas publicações</span>→</button>
              <button type="button" onClick={() => onNavigate("salvos")}>☆<span>Itens salvos</span>→</button>
              <button type="button" onClick={() => onNavigate("configuracoes")}>⚙<span>Configurações</span>→</button>
            </section>

            <section className="perfil-side-card perfil-danger-card">
              <h3>Conta</h3>
              <p>A exclusão é feita em Configurações, confirmando sua senha.</p>
              <button type="button" onClick={() => onNavigate("configuracoes")}>Excluir minha conta</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PerfilConclusao({ usuario, quantidadeHabilidades, onNavigate }) {
  const progresso = calcularProgressoPerfil(usuario, quantidadeHabilidades);

  // A conclusão é uma conquista permanente: não volte a pedir preenchimento se a pessoa editar ou remover dados depois.
  if (conquistaPerfilExibida(usuario) || progresso >= 100) return null;

  return (
    <section className="perfil-completion-card animate__animated animate__fadeInRight">
      <div className="perfil-completion-icon">✨</div>
      <div>
        <strong>Perfil {progresso}% completo</strong>
        <p>Complete suas informações para aumentar sua visibilidade.</p>
      </div>
      <div className="perfil-completion-bar"><span style={{ width: progresso + "%" }}></span></div>
      <button type="button" onClick={() => onNavigate("perfil")}>Continuar preenchendo →</button>
    </section>
  );
}

export default Perfil;
