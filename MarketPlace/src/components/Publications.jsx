import { useEffect, useMemo, useState } from "react";

const CHAVE = "marketfaesa-habilidades";

function lerPublicacoes() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function MinhasPublicacoes({ onNavigate }) {
  const [publicacoes, setPublicacoes] = useState(lerPublicacoes);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(publicacoes));
  }, [publicacoes]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return publicacoes;
    return publicacoes.filter((item) =>
      [item.nome, item.categoria, item.nivel, item.descricao, item.disponibilidade]
        .join(" ").toLowerCase().includes(termo)
    );
  }, [busca, publicacoes]);

  function excluir(id) {
    if (!window.confirm("Deseja excluir esta publicação?")) return;
    setPublicacoes((estado) => estado.filter((item) => item.id !== id));
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
                  <button type="button" className="danger" onClick={() => excluir(item.id)}>Excluir</button>
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

        {editando && (
          <div className="publication-modal-backdrop" onMouseDown={() => setEditando(null)}>
            <section className="publication-modal animate__animated animate__zoomIn" onMouseDown={(e) => e.stopPropagation()}>
              <div className="publication-modal-heading">
                <div><span>EDITAR PUBLICAÇÃO</span><h2>{editando.nome}</h2></div>
                <button type="button" onClick={() => setEditando(null)}>×</button>
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
