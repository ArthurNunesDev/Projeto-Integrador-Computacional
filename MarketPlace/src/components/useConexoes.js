import { useState } from "react";

import { aceitarConexao, mapaDeConexoes, recusarConexao, removerConexao, solicitarConexao } from "../api/conexoes.js";
import { abrirConversa } from "../api/conversas.js";
import { useCarregar, mensagemDoErro } from "../useCarregar.js";

/** Texto do botão de conexão conforme o estado com a pessoa. */
export function rotuloConexao(conexao) {
  if (!conexao) return "+ Conectar";
  if (conexao.status === "ACEITA") return "✓ Conectado";
  return conexao.enviadaPorMim ? "Pedido enviado" : "Aceitar pedido";
}

/**
 * Conexões do usuário (aceitas e pendentes) por id da pessoa, e as ações sobre elas.
 * alternar: conecta, aceita o pedido recebido, ou desfaz a conexão / cancela o pedido enviado.
 */
export function useConexoes(onAbrirConversa) {
  const { dados: mapa, carregando, erro: erroCarregar, recarregar, setDados } = useCarregar(mapaDeConexoes, new Map());
  const [erro, setErro] = useState("");

  function definir(pessoaId, conexao) {
    setDados((atual) => {
      const novo = new Map(atual);
      if (conexao) novo.set(pessoaId, conexao);
      else novo.delete(pessoaId);
      return novo;
    });
  }

  async function executar(acao) {
    try {
      await acao();
      setErro("");
    } catch (e) {
      setErro(mensagemDoErro(e));
    }
  }

  function alternar(pessoaId) {
    const atual = mapa.get(pessoaId);
    return executar(async () => {
      if (!atual) definir(pessoaId, await solicitarConexao(pessoaId));
      else if (atual.status === "PENDENTE" && !atual.enviadaPorMim) definir(pessoaId, await aceitarConexao(atual.id));
      else {
        await removerConexao(atual.id);
        definir(pessoaId, null);
      }
    });
  }

  function recusar(pessoaId) {
    const atual = mapa.get(pessoaId);
    return executar(async () => {
      await recusarConexao(atual.id);
      definir(pessoaId, null);
    });
  }

  // POST /api/conversas e abre a tela de mensagens (403 se a pessoa não aceita mensagens).
  function conversar(pessoaId) {
    return executar(async () => {
      const conversa = await abrirConversa(pessoaId);
      onAbrirConversa?.(conversa.id);
    });
  }

  return { mapa, carregando, erro: erro || erroCarregar, recarregar, alternar, recusar, conversar };
}
