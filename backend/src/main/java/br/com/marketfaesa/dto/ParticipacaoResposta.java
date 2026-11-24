package br.com.marketfaesa.dto;

import java.time.Instant;

// Candidatura vista pelo autor da oportunidade: pessoa é quem pediu para participar.
// status: PENDENTE, ACEITA ou RECUSADA.
public record ParticipacaoResposta(
        Long id,
        Long oportunidadeId,
        String status,
        PessoaResumo pessoa,
        Instant criadoEm) {
}
