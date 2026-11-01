package br.com.marketfaesa.dto;

import java.time.Instant;

// minha: o usuário logado é o autor (no front, autor "eu"/"outra"). lida: o destinatário já abriu a conversa.
public record MensagemResposta(Long id, Long autorId, boolean minha, String texto, boolean lida, Instant criadoEm) {
}
