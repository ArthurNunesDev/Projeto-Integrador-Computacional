package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotNull;

// Corpo do POST /api/conexoes: para quem vai o pedido de conexão.
public record ConexaoRequisicao(@NotNull Long destinatarioId) {
}
