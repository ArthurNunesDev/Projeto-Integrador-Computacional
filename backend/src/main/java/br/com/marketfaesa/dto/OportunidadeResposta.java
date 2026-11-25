package br.com.marketfaesa.dto;

import java.time.Instant;
import java.util.List;

// participando, minhaParticipacao e salva são do ponto de vista do usuário logado.
// minhaParticipacao: PENDENTE, ACEITA, RECUSADA ou null; participando é minhaParticipacao != null
// (mantido para o front que ainda lê o booleano). participantes conta todas as participações.
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
        String minhaParticipacao,
        boolean salva,
        Instant criadoEm,
        Instant atualizadoEm) {
}
