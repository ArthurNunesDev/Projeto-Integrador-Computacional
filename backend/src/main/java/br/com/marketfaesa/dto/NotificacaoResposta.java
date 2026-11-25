package br.com.marketfaesa.dto;

import java.time.Instant;

// Item de GET /api/notificacoes. ator é null quando não há uma pessoa por trás; alvoId é o id da conexão
// (CONEXAO_*) ou da oportunidade (PARTICIPACAO_* e OPORTUNIDADE_*), e pode já não existir.
public record NotificacaoResposta(Long id, String tipo, String texto, PessoaResumo ator, Long alvoId, boolean lida,
        Instant criadoEm) {
}
