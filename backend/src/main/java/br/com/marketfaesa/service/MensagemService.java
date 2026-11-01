package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.ConversaResposta;
import br.com.marketfaesa.dto.MensagemResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Mensagens diretas. Regra: qualquer usuário pode escrever para qualquer outro (não precisa de conexão),
// desde que o destinatário não tenha desligado "permitirMensagens" nas configurações.
@Service
public class MensagemService {

    private static final String SELECT_CONVERSAS = """
            SELECT v.id, v.atualizado_em, %s,
                   (SELECT count(*) FROM mensagens m
                     WHERE m.conversa_id = v.id AND m.autor_id <> :eu AND NOT m.lida) AS nao_lidas,
                   um.id AS um_id, um.autor_id AS um_autor_id, um.texto AS um_texto, um.lida AS um_lida,
                   um.criado_em AS um_criado_em
            FROM conversas v
            JOIN usuarios u ON u.id = CASE WHEN v.usuario_a_id = :eu THEN v.usuario_b_id ELSE v.usuario_a_id END
            LEFT JOIN cursos c ON c.id = u.curso_id
            LEFT JOIN LATERAL (SELECT * FROM mensagens m WHERE m.conversa_id = v.id
                               ORDER BY m.criado_em DESC, m.id DESC LIMIT 1) um ON true
            WHERE (v.usuario_a_id = :eu OR v.usuario_b_id = :eu)
            """.formatted(PessoaResumo.colunas("u", "c", "pessoa"));

    private final JdbcClient jdbc;

    public MensagemService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Mais recentes primeiro.
    @Transactional(readOnly = true)
    public List<ConversaResposta> listarConversas(Long eu) {
        return consultarConversas(eu, "ORDER BY v.atualizado_em DESC, v.id DESC", Map.of());
    }

    // Abre a conversa com a pessoa, ou devolve a que já existe.
    // 400 consigo mesmo; 404 se a pessoa não existe; 403 se ela não aceita mensagens.
    @Transactional
    public ConversaResposta abrir(Long eu, Long usuarioId) {
        if (usuarioId.equals(eu)) {
            throw ErroApiException.requisicaoInvalida("Você não pode conversar consigo mesmo");
        }
        if (!jdbc.sql("SELECT EXISTS (SELECT 1 FROM usuarios WHERE id = ?)").param(usuarioId)
                .query(Boolean.class).single()) {
            throw ErroApiException.naoEncontrado();
        }
        exigirQueAceitaMensagens(usuarioId);
        jdbc.sql("INSERT INTO conversas (usuario_a_id, usuario_b_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
                .params(eu, usuarioId).update();
        return consultarConversas(eu, "AND (v.usuario_a_id = :outro OR v.usuario_b_id = :outro)",
                Map.of("outro", usuarioId)).get(0);
    }

    // Em ordem de envio. Abrir a conversa marca como lidas as mensagens recebidas.
    @Transactional
    public List<MensagemResposta> listarMensagens(Long eu, Long conversaId) {
        exigirParticipante(eu, conversaId);
        jdbc.sql("UPDATE mensagens SET lida = true WHERE conversa_id = ? AND autor_id <> ? AND NOT lida")
                .params(conversaId, eu).update();
        return jdbc.sql("""
                SELECT id AS um_id, autor_id AS um_autor_id, texto AS um_texto, lida AS um_lida, criado_em AS um_criado_em
                FROM mensagens WHERE conversa_id = ? ORDER BY criado_em, id
                """)
                .param(conversaId)
                .query((rs, i) -> mensagem(rs, eu))
                .list();
    }

    @Transactional
    public MensagemResposta enviar(Long eu, Long conversaId, String texto) {
        exigirQueAceitaMensagens(exigirParticipante(eu, conversaId));
        MensagemResposta mensagem = jdbc.sql("""
                INSERT INTO mensagens (conversa_id, autor_id, texto) VALUES (?, ?, ?)
                RETURNING id AS um_id, autor_id AS um_autor_id, texto AS um_texto, lida AS um_lida, criado_em AS um_criado_em
                """)
                .params(conversaId, eu, texto)
                .query((rs, i) -> mensagem(rs, eu))
                .single();
        jdbc.sql("UPDATE conversas SET atualizado_em = now() WHERE id = ?").param(conversaId).update();
        return mensagem;
    }

    record Participantes(Long usuarioAId, Long usuarioBId) {
    }

    // 404 se a conversa não existe, 403 se o usuário não participa. Devolve o id do outro participante.
    private Long exigirParticipante(Long eu, Long conversaId) {
        Participantes p = jdbc.sql("SELECT usuario_a_id, usuario_b_id FROM conversas WHERE id = ?").param(conversaId)
                .query(Participantes.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
        if (p.usuarioAId().equals(eu)) {
            return p.usuarioBId();
        }
        if (p.usuarioBId().equals(eu)) {
            return p.usuarioAId();
        }
        throw ErroApiException.acessoNegado();
    }

    private void exigirQueAceitaMensagens(Long usuarioId) {
        boolean aceita = jdbc.sql("""
                SELECT COALESCE((SELECT permitir_mensagens FROM configuracoes_usuario WHERE usuario_id = ?), true)
                """).param(usuarioId).query(Boolean.class).single();
        if (!aceita) {
            throw ErroApiException.acessoNegado("Esta pessoa não aceita mensagens");
        }
    }

    private List<ConversaResposta> consultarConversas(Long eu, String resto, Map<String, ?> params) {
        return jdbc.sql(SELECT_CONVERSAS + resto)
                .param("eu", eu)
                .params(params)
                .query((rs, i) -> {
                    rs.getLong("um_id");
                    MensagemResposta ultima = rs.wasNull() ? null : mensagem(rs, eu);
                    return new ConversaResposta(rs.getLong("id"), PessoaResumo.de(rs, "pessoa"), ultima,
                            rs.getLong("nao_lidas"), rs.getTimestamp("atualizado_em").toInstant());
                })
                .list();
    }

    // Lê as colunas um_* (última mensagem na lista de conversas, ou cada mensagem da conversa).
    private static MensagemResposta mensagem(ResultSet rs, Long eu) throws SQLException {
        long autorId = rs.getLong("um_autor_id");
        return new MensagemResposta(rs.getLong("um_id"), autorId, autorId == eu, rs.getString("um_texto"),
                rs.getBoolean("um_lida"), rs.getTimestamp("um_criado_em").toInstant());
    }
}
