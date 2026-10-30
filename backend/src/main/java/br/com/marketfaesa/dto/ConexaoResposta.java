package br.com.marketfaesa.dto;

import java.time.Instant;

// Conexão do ponto de vista do usuário logado: pessoa é sempre o outro lado.
// status: PENDENTE ou ACEITA. enviadaPorMim: o usuário logado foi quem pediu.
public record ConexaoResposta(
        Long id,
        String status,
        boolean enviadaPorMim,
        PessoaResumo pessoa,
        Instant criadoEm,
        Instant atualizadoEm) {
}
