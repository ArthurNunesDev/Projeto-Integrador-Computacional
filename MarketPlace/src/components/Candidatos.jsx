import { useCallback, useRef, useState } from "react";
import "./Candidatos.scss";
import "./Participacao.scss";
import { definirStatusParticipacao, listarCandidatos } from "../api/oportunidades.js";
import { STATUS_PARTICIPACAO, descreverCurso, iniciais } from "../rotulos.js";
import { mensagemDoErro, useCarregar } from "../useCarregar.js";
import { useDialogo } from "../useDialogo.js";

const DECISOES = [
  { status: "ACEITA", rotulo: "Aceitar" },
  { status: "RECUSADA", rotulo: "Recusar" },
];

/**
 * Modal do autor com quem pediu para participar da oportunidade: aceitar ou recusar cada pedido.
 * Com a oportunidade encerrada a API não aceita decisões (409), então os botões ficam desabilitados.
 */
function Candidatos({ oportunidade, onFechar }) {
  const modalRef = useRef(null);
  const carregar = useCallback(() => listarCandidatos(oportunidade.id), [oportunidade.id]);
  const { dados: candidatos, carregando, erro, recarregar, setDados } = useCarregar(carregar, []);
  const [erroAcao, setErroAcao] = useState("");
  const [enviando, setEnviando] = useState(null);
  useDialogo(modalRef, true, onFechar);
  const encerrada = oportunidade.status === "FECHADA";

  async function decidir(candidato, status) {
    if (candidato.status === status || enviando) return;
    setEnviando(candidato.id);
    try {
      const atualizado = await definirStatusParticipacao(candidato.id, status);
      setDados((lista) => lista.map((c) => (c.id === atualizado.id ? atualizado : c)));
      setErroAcao("");
    } catch (e) {
      setErroAcao(mensagemDoErro(e));
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="publication-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onFechar(); }}>
      <section ref={modalRef} className="publication-modal candidates-modal" role="dialog" aria-modal="true" aria-labelledby="candidates-title">
        <div className="publication-modal-heading">
          <div><span>CANDIDATOS</span><h2 id="candidates-title">{oportunidade.titulo}</h2></div>
          <button type="button" aria-label="Fechar candidatos" onClick={onFechar}>×</button>
        </div>
        {encerrada && <p className="candidates-note">Oportunidade encerrada: reabra-a para aceitar ou recusar pedidos.</p>}
        {erroAcao && <p className="publication-persistence-error" role="alert">{erroAcao}</p>}
        {carregando ? (
          <p className="candidates-note" role="status">Carregando candidatos...</p>
        ) : erro ? (
          <div className="candidates-error" role="alert">
            <p>{erro}</p>
            <button type="button" onClick={recarregar}>Tentar novamente</button>
          </div>
        ) : candidatos.length ? (
          <ul className="candidates-list">
            {candidatos.map((candidato) => (
              <li key={candidato.id} className="candidate">
                <div className="candidate-avatar" aria-hidden="true">{iniciais(candidato.pessoa.nome)}</div>
                <div className="candidate-info">
                  <strong>{candidato.pessoa.nome}</strong>
                  <span>{descreverCurso(candidato.pessoa)}</span>
                </div>
                <span className={`participation-status participation-status--${candidato.status.toLowerCase()}`}>
                  {STATUS_PARTICIPACAO[candidato.status] || candidato.status}
                </span>
                <div className="candidate-actions" role="group" aria-label={`Decisão sobre ${candidato.pessoa.nome}`}>
                  {DECISOES.map(({ status, rotulo }) => (
                    <button key={status} type="button" className={status === "RECUSADA" ? "danger" : ""}
                      aria-pressed={candidato.status === status} disabled={encerrada}
                      onClick={() => decidir(candidato, status)}>
                      {rotulo}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="candidates-note">Ninguém pediu para participar ainda.</p>
        )}
      </section>
    </div>
  );
}

export default Candidatos;
