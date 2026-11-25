package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// Corpo do PATCH /api/participacoes/{id}: a decisão do autor. PENDENTE não é aceito (não há "desfazer").
public record ParticipacaoRequisicao(
        @NotNull @Pattern(regexp = "ACEITA|RECUSADA", message = "status inválido") String status) {
}
