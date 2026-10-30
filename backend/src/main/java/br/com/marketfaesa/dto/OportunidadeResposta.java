package br.com.marketfaesa.dto;

import java.time.Instant;
import java.util.List;

// participando e salva são do ponto de vista do usuário logado.
public record OportunidadeResposta(
        Long id,
        String tipo,
        String titulo,
        String descricao,
        String modalidade,
        String status,
        List<AreaResposta> areas,
        PessoaResumo autor,
        long participantes,
        boolean participando,
        boolean salva,
        Instant criadoEm,
        Instant atualizadoEm) {
}
