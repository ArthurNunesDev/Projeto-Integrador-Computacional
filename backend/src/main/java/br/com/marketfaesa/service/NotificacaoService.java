package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.NotificacaoContagem;
import br.com.marketfaesa.dto.NotificacaoResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Notificações in-app. Os services de domínio chamam notificar/remover diretamente, na mesma transação da ação
// (sem eventos assíncronos): se a ação falha, a notificação some junto, e não há fila para perder num restart.
// Mensagens não passam por aqui: o contador delas vem de mensagens.lida.
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    // Cada tipo diz qual preferência de configuracoes_usuario o liga/desliga (null = sempre envia) e se a chave
    // de deduplicação inclui o ator (vários candidatos na mesma oportunidade geram notificações separadas).
    // A coluna vai para o SQL por concatenação: vem só deste enum, nunca do usuário.
    public enum Tipo {
        CONEXAO_SOLICITADA("conexoes", false),
        CONEXAO_ACEITA("conexoes", false),
        PARTICIPACAO_NOVA("publicacoes", true),
        PARTICIPACAO_ACEITA("publicacoes", false),
        PARTICIPACAO_RECUSADA("publicacoes", false),
        OPORTUNIDADE_FECHADA(null, false),
        OPORTUNIDADE_REMOVIDA(null, false);

        private final String preferencia;
        private final boolean chavePorAtor;

        Tipo(String preferencia, boolean chavePorAtor) {
            this.preferencia = preferencia;
            this.chavePorAtor = chavePorAtor;
        }

        private String condicaoPreferencia(String destinatario) {
            return preferencia == null ? "true" : "COALESCE((SELECT cu." + preferencia
                    + " FROM configuracoes_usuario cu WHERE cu.usuario_id = " + destinatario + "), true)";
        }
    }

    static final int TAMANHO_TEXTO = 300;
    static final int LIMITE_MAXIMO = 50;

    private static final String UPSERT = """
            ON CONFLICT (destinatario_id, chave) WHERE lida_em IS NULL
            DO UPDATE SET criado_em = now(), texto = EXCLUDED.texto
            """;

    private final JdbcClient jdbc;

    public NotificacaoService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Ex.: 'CONEXAO_SOLICITADA:12' ou 'PARTICIPACAO_NOVA:7:3' (oportunidade 7, candidato 3).
    public static String chave(Tipo tipo, Long alvoId, Long atorId) {
        return tipo.chavePorAtor ? tipo.name() + ":" + alvoId + ":" + atorId : tipo.name() + ":" + alvoId;
    }

    // Ignora quando o ator é o próprio destinatário ou a preferência do destinatário está desligada.
    // Repetir com a mesma chave enquanto a anterior não foi lida atualiza a existente (texto e criado_em).
    @Transactional
    public void notificar(Long destinatarioId, Long atorId, Tipo tipo, Long alvoId, String texto) {
        if (destinatarioId.equals(atorId)) {
            return;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("destinatario", destinatarioId);
        params.put("ator", atorId);
        params.put("tipo", tipo.name());
        params.put("alvo", alvoId);
        params.put("texto", cortar(texto));
        params.put("chave", chave(tipo, alvoId, atorId));
        jdbc.sql("""
                INSERT INTO notificacoes (destinatario_id, ator_id, tipo, alvo_id, texto, chave)
                SELECT :destinatario, :ator, :tipo, :alvo, :texto, :chave
                WHERE %s
                """.formatted(tipo.condicaoPreferencia(":destinatario")) + UPSERT)
                .params(params).update();
    }

    // Para todos os participantes (PENDENTE ou ACEITA) da oportunidade, menos o ator. Chamar antes de apagar a
    // oportunidade: o DELETE leva as participações junto.
    @Transactional
    public void notificarParticipantes(Long oportunidadeId, Long atorId, Tipo tipo, String texto) {
        Map<String, Object> params = new HashMap<>();
        params.put("oportunidade", oportunidadeId);
        params.put("ator", atorId);
        params.put("tipo", tipo.name());
        params.put("texto", cortar(texto));
        params.put("chave", chave(tipo, oportunidadeId, atorId));
        jdbc.sql("""
                INSERT INTO notificacoes (destinatario_id, ator_id, tipo, alvo_id, texto, chave)
                SELECT pa.usuario_id, :ator, :tipo, :oportunidade, :texto, :chave
                FROM participacoes pa
                WHERE pa.oportunidade_id = :oportunidade AND pa.status <> 'RECUSADA'
                  AND pa.usuario_id IS DISTINCT FROM CAST(:ator AS bigint) AND %s
                """.formatted(tipo.condicaoPreferencia("pa.usuario_id")) + UPSERT)
                .params(params).update();
    }

    // Apaga só a não lida (o pedido foi desfeito antes de a pessoa ver); as lidas ficam no histórico.
    @Transactional
    public void remover(Long destinatarioId, String chave) {
        jdbc.sql("DELETE FROM notificacoes WHERE destinatario_id = ? AND chave = ? AND lida_em IS NULL")
                .params(destinatarioId, chave).update();
    }

    // Nome usado nos textos ("Ana Souza quer se conectar com você.").
    @Transactional(readOnly = true)
    public String nome(Long usuarioId) {
        return jdbc.sql("SELECT nome FROM usuarios WHERE id = ?").param(usuarioId).query(String.class).single();
    }

    // Mais novas primeiro; antesDeId é o cursor (id da última recebida). limite 1..50.
    @Transactional(readOnly = true)
    public List<NotificacaoResposta> listar(Long eu, int limite, Long antesDeId, boolean naoLidas) {
        if (limite < 1 || limite > LIMITE_MAXIMO) {
            throw ErroApiException.campoInvalido("limite", "deve estar entre 1 e " + LIMITE_MAXIMO);
        }
        Map<String, Object> params = new HashMap<>();
        params.put("eu", eu);
        params.put("limite", limite);
        params.put("antesDeId", antesDeId);
        params.put("naoLidas", naoLidas);
        return jdbc.sql("""
                SELECT n.id, n.tipo, n.texto, n.alvo_id, n.lida_em IS NOT NULL AS lida, n.criado_em, %s
                FROM notificacoes n
                LEFT JOIN usuarios u ON u.id = n.ator_id
                LEFT JOIN cursos c ON c.id = u.curso_id
                WHERE n.destinatario_id = :eu
                  AND (CAST(:antesDeId AS bigint) IS NULL OR n.id < :antesDeId)
                  AND (NOT :naoLidas OR n.lida_em IS NULL)
                ORDER BY n.id DESC
                LIMIT :limite
                """.formatted(PessoaResumo.colunas("u", "c", "ator")))
                .params(params)
                .query((rs, i) -> {
                    rs.getLong("ator_id");
                    PessoaResumo ator = rs.wasNull() ? null : PessoaResumo.de(rs, "ator");
                    long alvoId = rs.getLong("alvo_id");
                    return new NotificacaoResposta(rs.getLong("id"), rs.getString("tipo"), rs.getString("texto"), ator,
                            rs.wasNull() ? null : alvoId, rs.getBoolean("lida"), rs.getTimestamp("criado_em").toInstant());
                })
                .list();
    }

    // Mensagens não lidas: recebidas (autor é o outro) nas conversas do usuário.
    @Transactional(readOnly = true)
    public NotificacaoContagem contar(Long eu) {
        return jdbc.sql("""
                SELECT (SELECT count(*) FROM notificacoes WHERE destinatario_id = :eu AND lida_em IS NULL) AS nao_lidas,
                       (SELECT count(*) FROM mensagens m JOIN conversas v ON v.id = m.conversa_id
                        WHERE (v.usuario_a_id = :eu OR v.usuario_b_id = :eu)
                          AND m.autor_id <> :eu AND NOT m.lida) AS mensagens_nao_lidas
                """)
                .param("eu", eu)
                .query((rs, i) -> new NotificacaoContagem(rs.getLong("nao_lidas"), rs.getLong("mensagens_nao_lidas")))
                .single();
    }

    // Idempotente; 404 se não existe, 403 se é de outro usuário.
    @Transactional
    public void marcarLida(Long eu, Long id) {
        Long destinatarioId = jdbc.sql("SELECT destinatario_id FROM notificacoes WHERE id = ?").param(id)
                .query(Long.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
        if (!destinatarioId.equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
        jdbc.sql("UPDATE notificacoes SET lida_em = now() WHERE id = ? AND lida_em IS NULL").param(id).update();
    }

    // Com ateId, só as de id <= ateId: as que chegaram depois de o usuário abrir a lista continuam não lidas.
    @Transactional
    public void marcarTodas(Long eu, Long ateId) {
        Map<String, Object> params = new HashMap<>();
        params.put("eu", eu);
        params.put("ateId", ateId);
        jdbc.sql("""
                UPDATE notificacoes SET lida_em = now()
                WHERE destinatario_id = :eu AND lida_em IS NULL AND (CAST(:ateId AS bigint) IS NULL OR id <= :ateId)
                """)
                .params(params).update();
    }

    // Retenção: lidas há mais de 30 dias e qualquer uma com mais de 90 dias. Roda ao subir e a cada 12 horas
    // (o host gratuito reinicia com frequência, então o ApplicationReadyEvent cobre a maior parte das execuções).
    @EventListener(ApplicationReadyEvent.class)
    public void limparAoSubir() {
        limparAntigas();
    }

    @Scheduled(initialDelay = 12, fixedDelay = 12, timeUnit = TimeUnit.HOURS)
    public void limparPeriodicamente() {
        limparAntigas();
    }

    public int limparAntigas() {
        int apagadas = jdbc.sql("""
                DELETE FROM notificacoes
                WHERE lida_em < now() - interval '30 days' OR criado_em < now() - interval '90 days'
                """).update();
        if (apagadas > 0) {
            log.info("Notificações antigas apagadas: {}", apagadas);
        }
        return apagadas;
    }

    private static String cortar(String texto) {
        return texto.length() <= TAMANHO_TEXTO ? texto : texto.substring(0, TAMANHO_TEXTO - 1) + "…";
    }
}
