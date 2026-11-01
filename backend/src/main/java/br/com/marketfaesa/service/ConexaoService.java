package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.ConexaoResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Conexões entre usuários: pedido (PENDENTE) -> aceito (ACEITA). Recusar, cancelar o pedido e
// desfazer a conexão apagam a linha, então o par pode pedir de novo depois.
@Service
public class ConexaoService {

    private static final String SELECT = """
            SELECT k.id, k.status, k.solicitante_id = :eu AS enviada_por_mim, k.criado_em, k.atualizado_em, %s
            FROM conexoes k
            JOIN usuarios u ON u.id = CASE WHEN k.solicitante_id = :eu THEN k.destinatario_id ELSE k.solicitante_id END
            LEFT JOIN cursos c ON c.id = u.curso_id
            WHERE (k.solicitante_id = :eu OR k.destinatario_id = :eu)
            """.formatted(PessoaResumo.colunas("u", "c", "pessoa"));

    private final JdbcClient jdbc;

    public ConexaoService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ConexaoResposta> listarAceitas(Long eu) {
        return consultar(eu, "AND k.status = 'ACEITA' ORDER BY u.nome, k.id", Map.of());
    }

    @Transactional(readOnly = true)
    public List<ConexaoResposta> listarRecebidas(Long eu) {
        return consultar(eu, "AND k.status = 'PENDENTE' AND k.destinatario_id = :eu ORDER BY k.criado_em DESC, k.id DESC",
                Map.of());
    }

    @Transactional(readOnly = true)
    public List<ConexaoResposta> listarEnviadas(Long eu) {
        return consultar(eu, "AND k.status = 'PENDENTE' AND k.solicitante_id = :eu ORDER BY k.criado_em DESC, k.id DESC",
                Map.of());
    }

    // 400 para si mesmo; 404 se o destinatário não existe; 409 se já há conexão ou pedido (em qualquer sentido).
    @Transactional
    public ConexaoResposta solicitar(Long eu, Long destinatarioId) {
        if (destinatarioId.equals(eu)) {
            throw ErroApiException.requisicaoInvalida("Você não pode se conectar consigo mesmo");
        }
        if (!jdbc.sql("SELECT EXISTS (SELECT 1 FROM usuarios WHERE id = ?)").param(destinatarioId)
                .query(Boolean.class).single()) {
            throw ErroApiException.naoEncontrado();
        }
        // O índice único sem ordem do par (V3) barra A->B e B->A; ON CONFLICT evita abortar a transação.
        Long id = jdbc.sql("""
                INSERT INTO conexoes (solicitante_id, destinatario_id) VALUES (?, ?)
                ON CONFLICT DO NOTHING RETURNING id
                """)
                .params(eu, destinatarioId).query(Long.class).optional()
                .orElseThrow(() -> ErroApiException.conflito("Já existe uma conexão ou um pedido com esta pessoa"));
        return buscar(eu, id);
    }

    // Só quem recebeu o pedido aceita (403 para os demais); 409 se já foi aceito.
    @Transactional
    public ConexaoResposta aceitar(Long eu, Long id) {
        exigirPedidoRecebido(eu, id);
        jdbc.sql("UPDATE conexoes SET status = 'ACEITA', atualizado_em = now() WHERE id = ?").param(id).update();
        return buscar(eu, id);
    }

    @Transactional
    public void recusar(Long eu, Long id) {
        exigirPedidoRecebido(eu, id);
        jdbc.sql("DELETE FROM conexoes WHERE id = ?").param(id).update();
    }

    // Qualquer um dos dois lados: cancela o pedido enviado ou desfaz a conexão.
    @Transactional
    public void remover(Long eu, Long id) {
        Partes partes = partes(id);
        if (!partes.solicitanteId().equals(eu) && !partes.destinatarioId().equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
        jdbc.sql("DELETE FROM conexoes WHERE id = ?").param(id).update();
    }

    record Partes(Long solicitanteId, Long destinatarioId, String status) {
    }

    private Partes partes(Long id) {
        return jdbc.sql("SELECT solicitante_id, destinatario_id, status FROM conexoes WHERE id = ?").param(id)
                .query(Partes.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
    }

    private void exigirPedidoRecebido(Long eu, Long id) {
        Partes partes = partes(id);
        if (!partes.destinatarioId().equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
        if (!"PENDENTE".equals(partes.status())) {
            throw ErroApiException.conflito("Pedido já aceito");
        }
    }

    private ConexaoResposta buscar(Long eu, Long id) {
        return consultar(eu, "AND k.id = :id", Map.of("id", id)).get(0);
    }

    private List<ConexaoResposta> consultar(Long eu, String resto, Map<String, ?> params) {
        return jdbc.sql(SELECT + resto)
                .param("eu", eu)
                .params(params)
                .query((rs, i) -> new ConexaoResposta(rs.getLong("id"), rs.getString("status"),
                        rs.getBoolean("enviada_por_mim"), PessoaResumo.de(rs, "pessoa"),
                        rs.getTimestamp("criado_em").toInstant(), rs.getTimestamp("atualizado_em").toInstant()))
                .list();
    }
}
