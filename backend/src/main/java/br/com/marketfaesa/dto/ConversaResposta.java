package br.com.marketfaesa.dto;

import java.time.Instant;

// Conversa do ponto de vista do usuário logado: pessoa é o outro participante; naoLidas conta
// as mensagens dele ainda não lidas; ultimaMensagem é null em conversa sem mensagens.
public record ConversaResposta(
        Long id,
        PessoaResumo pessoa,
        MensagemResposta ultimaMensagem,
        long naoLidas,
        Instant atualizadoEm) {
}
