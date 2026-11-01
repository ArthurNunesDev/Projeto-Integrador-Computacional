import { useMemo, useState } from "react";
import { definirSalva, listarSalvas } from "../api/oportunidades.js";
import { formatarOportunidade } from "../rotulos.js";
import { mensagemDoErro, useCarregar } from "../useCarregar.js";

function carregarSalvas() {
  return listarSalvas().then((lista) => lista.map(formatarOportunidade));
}

function Salvos({ onNavigate }) {
  const { dados: salvos, carregando, erro, recarregar, setDados } = useCarregar(carregarSalvas, []);
  const [busca, setBusca] = useState("");
  const [erroPersistencia, setErroPersistencia] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return salvos;
    return salvos.filter((item) =>
      [item.titulo, item.area, item.tipo, item.modalidade, item.pessoa]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, salvos]);

  async function remover(id) {
    try {
      await definirSalva(id, false);
      setDados((lista) => lista.filter((item) => item.id !== id));
      setErroPersistencia("");
    } catch (e) {
      setErroPersistencia(mensagemDoErro(e));
    }
  }

  return (
    <main className="saved-page">
      <div className="saved-container">
        <section className="saved-header animate__animated animate__fadeInDown">
          <div>
            <span>MINHA ÁREA</span>
            <h1>Salvos</h1>
            <p>Guarde oportunidades que você quer analisar ou participar depois.</p>
          </div>
          <div className="saved-count">
            <strong>{salvos.length}</strong>
            <span>{salvos.length === 1 ? "oportunidade salva" : "oportunidades salvas"}</span>
          </div>
        </section>

        {erroPersistencia && <p className="saved-persistence-error" role="alert">{erroPersistencia}</p>}

        <section className="saved-toolbar animate__animated animate__fadeInUp">
          <div className="saved-search">
            <span>⌕</span>
            <input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar nos salvos..." aria-label="Buscar nos salvos" />
          </div>
          <button type="button" className="saved-explore" onClick={() => onNavigate?.("oportunidades")}>Explorar oportunidades →</button>
        </section>

        {carregando ? (
          <p className="saved-loading" role="status">Carregando seus salvos...</p>
        ) : erro ? (
          <section className="saved-empty">
            <div className="saved-empty-icon">!</div>
            <h2>Não foi possível carregar seus salvos</h2>
            <p>{erro}</p>
            <button type="button" onClick={recarregar}>Tentar novamente</button>
          </section>
        ) : filtrados.length ? (
          <section className="saved-results">
            {filtrados.map((item, index) => (
              <article className="saved-card animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 60}ms` }} key={item.id}>
                <div className="saved-card-top">
                  <div className="saved-icon">{item.icon}</div>
                  <button type="button" className="saved-remove" onClick={() => remover(item.id)} aria-label={`Remover ${item.titulo} dos salvos`}>♥</button>
                </div>
                <span className="saved-type">{item.tipo}</span>
                <h2>{item.titulo}</h2>
                <p>{item.descricao}</p>
                <div className="saved-info"><span>✦ {item.area}</span><span>◷ {item.modalidade}</span></div>
                <div className="saved-footer">
                  <div className="saved-person"><div>{item.inicial}</div><span><strong>{item.pessoa}</strong>{item.curso}</span></div>
                  <button type="button" onClick={() => onNavigate?.("oportunidades")}>Ver oportunidade</button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="saved-empty animate__animated animate__fadeIn">
            <div className="saved-empty-icon">♡</div>
            <h2>{salvos.length ? "Nenhum salvo encontrado" : "Você ainda não salvou nada"}</h2>
            <p>{salvos.length ? "Tente buscar por outro termo." : "Quando encontrar uma oportunidade interessante, toque no coração para guardá-la aqui."}</p>
            <button type="button" onClick={() => onNavigate?.("oportunidades")}>Encontrar oportunidades</button>
          </section>
        )}
      </div>
    </main>
  );
}

export default Salvos;
