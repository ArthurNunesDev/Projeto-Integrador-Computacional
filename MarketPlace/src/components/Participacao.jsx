import "./Participacao.scss";
import { STATUS_PARTICIPACAO } from "../rotulos.js";

/**
 * Ação de participação de quem não é o autor: "Participar" enquanto não pediu; depois, o status do pedido
 * (Pendente, Aceita ou Recusada) no lugar do botão. compacto esconde o "Cancelar" (cards com pouco espaço).
 * classeBotao: classe do botão "Participar" no layout de cada tela.
 */
export function AcaoParticipacao({ item, onAlternar, compacto = false, classeBotao = "" }) {
  const status = item.minhaParticipacao;
  if (!status) {
    if (item.status === "FECHADA") return <button type="button" disabled>Encerrada</button>;
    return <button type="button" className={classeBotao} onClick={() => onAlternar(item, "participando")}>Participar</button>;
  }
  return (
    <span className="participation-state">
      <span className={`participation-status participation-status--${status.toLowerCase()}`}>
        <span className="visualmente-oculto">Sua participação: </span>{STATUS_PARTICIPACAO[status] || status}
      </span>
      {!compacto && status !== "RECUSADA" && (
        <button type="button" className="participation-cancel" onClick={() => onAlternar(item, "participando")}
          aria-label={`Cancelar participação em ${item.titulo}`}>
          Cancelar
        </button>
      )}
    </span>
  );
}
