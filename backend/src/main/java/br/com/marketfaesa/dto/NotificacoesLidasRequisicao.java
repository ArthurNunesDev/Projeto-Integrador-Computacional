package br.com.marketfaesa.dto;

// Corpo opcional do PUT /api/notificacoes/lidas: marca só as de id <= ateId (as que o usuário já viu).
// Sem corpo ou sem ateId, marca todas.
public record NotificacoesLidasRequisicao(Long ateId) {
}
