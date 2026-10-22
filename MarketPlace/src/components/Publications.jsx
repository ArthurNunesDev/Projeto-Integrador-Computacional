import { useEffect, useMemo, useRef, useState } from "react";
import { chaveUsuario, lerValorSeguro, salvarValorSeguro } from "../storage.js";

const CHAVE = "marketfaesa-habilidades";

function lerPublicacoes(chave) {
  try {
    const dados = JSON.parse(lerValorSeguro(chave));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function MinhasPublicacoes({ onNavigate, usuarioId }) {
  const chave = chaveUsuario(CHAVE, usuarioId);
  const [publicacoes, setPublicacoes] = useState(() => lerPublicacoes(chave));
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);
  const modalRef = useRef(null);
  const modalAberto = Boolean(editando || confirmandoExclusao);

  useEffect(() => {
    salvarValorSeguro(chave, JSON.stringify(publicacoes));
  }, [chave, publicacoes]);

  useEffect(() => {
    if (!modalAberto || !modalRef.current) return undefined;

    const modal = modalRef.current;
    const elementoAnterior = document.activeElement;
    const primeiroCampo = modal.querySelector("form input, form select, form textarea");
    const controles = Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    (primeiroCampo || controles[0])?.focus();

    function tratarTeclado(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditando(null);
        setConfirmandoExclusao(null);
        return;
      }

      if (event.key !== "Tab" || controles.length === 0) return;

      const primeiro = controles[0];
      const ultimo = controles[controles.length - 1];

      if (event.shiftKey && (document.activeElement === primeiro || !modal.contains(document.activeElement))) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (document.activeElement === ultimo || !modal.contains(document.activeElement))) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", tratarTeclado);

    return () => {
      document.removeEventListener("keydown", tratarTeclado);
      if (elementoAnterior instanceof HTMLElement && elementoAnterior.isConnected) {
        elementoAnterior.focus();
      }
    };
  }, [modalAberto]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return publicacoes;
    return publicacoes.filter((item) =>
      [item.nome, item.categoria, item.nivel, item.descricao, item.disponibilidade]
        .join(" ").toLowerCase().includes(termo)
    );
  }, [busca, publicacoes]);

  function excluir() {
    if (!confirmandoExclusao) return;
    setPublicacoes((estado) => estado.filter((item) => item.id !== confirmandoExclusao.id));
    setConfirmandoExclusao(null);
  }

  function salvarEdicao(event) {
    event.preventDefault();
    setPublicacoes((estado) => estado.map((item) =>
      item.id === editando.id ? { ...item, ...editando } : item
    ));
    setEditando(null);
  }

  return (
    <main className="publications-page">
      <div className="publications-container">
        <section className="publications-header animate__animated animate__fadeInDown">
          <div>
            <span>MINHA ÁREA</span>
            <h1>Minhas Publicações</h1>
            <p>Gerencie as habilidades que você publicou no Market FAESA.</p>
          </div>
          <div className="publications-header-actions">
            <button className="publications-create-button" type="button" onClick={() => onNavigate?.("publicar-habilidade")}>+ Criar publicação</button>
            <div className="publications-total">
            <strong>{publicacoes.length}</strong>
            <span>{publicacoes.length === 1 ? "publicação" : "publicações"}</span>
            </div>
          </div>
        </section>

        <section className="publications-toolbar animate__animated animate__fadeInUp">
          <div className="publications-search">
            <span>⌕</span>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar minhas publicações..." />
          </div>
        </section>

        {filtradas.length ? (
          <section className="publications-grid">
            {filtradas.map((item, index) => (
              <article className="publication-card animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 60}ms` }} key={item.id}>
                <div className="publication-top">
                  <div className="publication-icon">✦</div>
                  <span>{item.nivel}</span>
                </div>
                <div className="publication-category">{item.categoria}</div>
                <h2>{item.nome}</h2>
                <p>{item.descricao}</p>
                <div className="publication-availability">Disponível para <strong>{item.disponibilidade.toLowerCase()}</strong></div>
                <div className="publication-actions">
                  <button type="button" onClick={() => setEditando({ ...item })}>Editar</button>
                  <button type="button" className="danger" onClick={() => setConfirmandoExclusao({ ...item })}>Excluir</button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="publications-empty animate__animated animate__fadeIn">
            <div>▤</div>
            <h2>{publicacoes.length ? "Nenhuma publicação encontrada" : "Você ainda não publicou nada"}</h2>
            <p>{publicacoes.length ? "Tente buscar por outro termo." : "Publique uma habilidade para começar a montar seu portfólio no Market FAESA."}</p>
          </section>
        )}


        {confirmandoExclusao && (
          <div
            className="publication-modal-backdrop publication-delete-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setConfirmandoExclusao(null);
            }}
          >
            <section
              ref={modalRef}
              className="publication-delete-modal animate__animated animate__zoomIn"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publication-delete-title"
              aria-describedby="publication-delete-description"
            >
              <div className="publication-delete-icon" aria-hidden="true">!</div>
              <span className="publication-delete-eyebrow">CONFIRMAÇÃO DE EXCLUSÃO</span>
              <h2 id="publication-delete-title">Excluir publicação?</h2>
              <p id="publication-delete-description">
                Você está prestes a excluir <strong>{confirmandoExclusao.nome}</strong>.
                Essa ação não pode ser desfeita.
              </p>
              <div className="publication-delete-actions">
                <button type="button" className="publication-delete-cancel" onClick={() => setConfirmandoExclusao(null)}>Cancelar</button>
                <button type="button" className="publication-delete-confirm" onClick={excluir}>Sim, excluir</button>
              </div>
            </section>
          </div>
        )}
\n        {editando && (
          <div
            className="publication-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setEditando(null);
            }}
          >
            <section
              ref={modalRef}
              className="publication-modal animate__animated animate__zoomIn"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publication-modal-title"
            >
              <div className="publication-modal-heading">
                <div><span>EDITAR PUBLICAÇÃO</span><h2 id="publication-modal-title">{editando.nome}</h2></div>
                <button type="button" aria-label="Fechar edição" onClick={() => setEditando(null)}>×</button>
              </div>
              <form onSubmit={salvarEdicao}>
                <label>Nome<input value={editando.nome} onChange={(e) => setEditando({...editando,nome:e.target.value})} required /></label>
                <div className="publication-form-row">
                  <label>Categoria<select value={editando.categoria} onChange={(e) => setEditando({...editando,categoria:e.target.value})}><option>Tecnologia</option><option>Design</option><option>Negócios</option><option>Comunicação</option><option>Saúde</option><option>Direito</option><option>Engenharia</option><option>Outras</option></select></label>
                  <label>Nível<select value={editando.nivel} onChange={(e) => setEditando({...editando,nivel:e.target.value})}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option><option>Especialista</option></select></label>
                </div>
                <label>Descrição<textarea rows="5" value={editando.descricao} onChange={(e) => setEditando({...editando,descricao:e.target.value})} required /></label>
                <label>Disponibilidade<select value={editando.disponibilidade} onChange={(e) => setEditando({...editando,disponibilidade:e.target.value})}><option>Projetos e freelas</option><option>Projetos acadêmicos</option><option>Monitorias e aulas</option><option>Colaborações</option></select></label>
                <div className="publication-modal-actions"><button type="button" onClick={() => setEditando(null)}>Cancelar</button><button type="submit">Salvar alterações</button></div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default MinhasPublicacoes;
