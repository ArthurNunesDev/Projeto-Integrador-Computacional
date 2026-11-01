package br.com.marketfaesa.dto;

import java.time.Instant;

public record HabilidadePublicadaResposta(
        Long id,
        String nome,
        String categoria,
        String nivel,
        String descricao,
        String disponibilidade,
        PessoaResumo usuario,
        Instant criadoEm,
        Instant atualizadoEm) {
}
