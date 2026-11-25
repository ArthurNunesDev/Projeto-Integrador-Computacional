import { useState } from "react";

import { definirParticipacao, definirSalva, listarOportunidades } from "../api/oportunidades.js";
import { formatarOportunidade } from "../rotulos.js";
import { mensagemDoErro } from "../useCarregar.js";

/** Lista de oportunidades já no formato dos cards. */
export function carregarOportunidades() {
  return listarOportunidades().then((lista) => lista.map(formatarOportunidade));
}

/**
 * Salvar/participar de uma oportunidade pela API e refletir na lista local.
 * campo: "salva" (PUT/DELETE .../salvo) ou "participando" (POST/DELETE .../participacao).
 */
export function useAcoesOportunidade(setOportunidades) {
  const [erro, setErro] = useState("");

  async function alternar(item, campo) {
    const novoValor = !item[campo];
    try {
      if (campo === "salva") await definirSalva(item.id, novoValor);
      else await definirParticipacao(item.id, novoValor);
      // Participar cria um pedido PENDENTE; cancelar apaga o pedido.
      const extra = campo === "participando" ? { minhaParticipacao: novoValor ? "PENDENTE" : null } : {};
      setOportunidades((lista) => lista.map((o) => (o.id === item.id ? { ...o, [campo]: novoValor, ...extra } : o)));
      setErro("");
    } catch (e) {
      setErro(mensagemDoErro(e));
    }
  }

  return { erro, alternar };
}
