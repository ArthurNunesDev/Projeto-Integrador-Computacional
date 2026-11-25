package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.ParticipacaoResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Candidaturas do ponto de vista do autor da oportunidade: listar e aceitar/recusar.
// Pedir e cancelar ficam no OportunidadeService (rota /api/oportunidades/{id}/participacao).
@Service
public class ParticipacaoService {

    private static final String SELECT = """
            SELECT pa.id, pa.oportunidade_id, pa.status, pa.criado_em, %s
            FROM participacoes pa
            JOIN usuarios u ON u.id = pa.usuario_id
            LEFT JOIN cursos c ON c.id = u.curso_id
            """.formatted(PessoaResumo.colunas("u", "c", "pessoa"));

    private final JdbcClient jdbc;

    public ParticipacaoService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Só o autor; 404 se a oportunidade não existe. Ordem de chegada.
    @Transactional(readOnly = true)
    public List<ParticipacaoResposta> listar(Long eu, Long oportunidadeId) {
        Long autorId = jdbc.sql("SELECT autor_id FROM oportunidades WHERE id = ?").param(oportunidadeId)
                .query(Long.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
        if (!autorId.equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
        return consultar("WHERE pa.oportunidade_id = :oportunidadeId ORDER BY pa.criado_em, pa.id",
                Map.of("oportunidadeId", oportunidadeId));
    }

    // Só o autor da oportunidade (403); 404 se a participação não existe; 409 se a oportunidade
    // está FECHADA (mesma regra do participar). Repetir o status atual não é erro: devolve 200 sem mudar nada.
    // O autor pode trocar de ideia (ACEITA <-> RECUSADA) enquanto a oportunidade estiver aberta.
    @Transactional
    public ParticipacaoResposta definirStatus(Long eu, Long id, String status) {
        Situacao situacao = jdbc.sql("""
                SELECT o.autor_id, o.status AS status_oportunidade, pa.status
                FROM participacoes pa JOIN oportunidades o ON o.id = pa.oportunidade_id
                WHERE pa.id = ?
                FOR UPDATE OF pa
                """).param(id)
                .query(Situacao.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
        if (!situacao.autorId().equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
        if (!"ABERTA".equals(situacao.statusOportunidade())) {
            throw ErroApiException.conflito("Oportunidade fechada");
        }
        if (!status.equals(situacao.status())) {
            jdbc.sql("UPDATE participacoes SET status = ? WHERE id = ?").params(status, id).update();
        }
        return consultar("WHERE pa.id = :id", Map.of("id", id)).get(0);
    }

    record Situacao(Long autorId, String statusOportunidade, String status) {
    }

    private List<ParticipacaoResposta> consultar(String resto, Map<String, ?> params) {
        return jdbc.sql(SELECT + resto)
                .params(params)
                .query((rs, i) -> new ParticipacaoResposta(rs.getLong("id"), rs.getLong("oportunidade_id"),
                        rs.getString("status"), PessoaResumo.de(rs, "pessoa"), rs.getTimestamp("criado_em").toInstant()))
                .list();
    }
}
