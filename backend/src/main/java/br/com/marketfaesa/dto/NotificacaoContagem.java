package br.com.marketfaesa.dto;

// GET /api/notificacoes/contagem: notificações não lidas e mensagens recebidas não lidas (estas vêm de mensagens.lida).
public record NotificacaoContagem(long naoLidas, long mensagensNaoLidas) {
}
