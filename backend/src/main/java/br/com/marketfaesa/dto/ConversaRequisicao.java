package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotNull;

// Corpo do POST /api/conversas: com quem conversar.
public record ConversaRequisicao(@NotNull Long usuarioId) {
}
