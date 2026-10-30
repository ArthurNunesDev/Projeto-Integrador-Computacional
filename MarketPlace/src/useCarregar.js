import { useCallback, useEffect, useState } from "react";

import { ApiError } from "./api/client.js";

export const MENSAGEM_ERRO_PADRAO = "Não foi possível concluir a operação. Tente novamente.";

export function mensagemDoErro(erro, porStatus = {}) {
  if (!(erro instanceof ApiError)) return MENSAGEM_ERRO_PADRAO;
  return porStatus[erro.status] || erro.mensagem || MENSAGEM_ERRO_PADRAO;
}

/**
 * Chama carregar() ao montar e sempre que a função mudar (use useCallback ou uma função de módulo).
 * Devolve {dados, erro, carregando, recarregar, setDados}; setDados atualiza os dados após uma ação.
 */
export function useCarregar(carregar, inicial = null) {
  const [estado, setEstado] = useState({ dados: inicial, erro: "", carregando: true });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar().then(
      (dados) => ativo && setEstado({ dados, erro: "", carregando: false }),
      (erro) => ativo && setEstado((atual) => ({ ...atual, erro: mensagemDoErro(erro), carregando: false })),
    );
    return () => {
      ativo = false;
    };
  }, [carregar, versao]);

  const recarregar = useCallback(() => {
    setEstado((atual) => ({ ...atual, erro: "", carregando: true }));
    setVersao((v) => v + 1);
  }, []);

  const setDados = useCallback((atualizar) => {
    setEstado((atual) => ({
      ...atual,
      dados: typeof atualizar === "function" ? atualizar(atual.dados) : atualizar,
    }));
  }, []);

  return { ...estado, recarregar, setDados };
}
