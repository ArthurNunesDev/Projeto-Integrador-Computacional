package br.com.marketfaesa.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.marketfaesa.service.NotificacaoService.Tipo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class NotificacaoServiceTests {

    @Autowired
    NotificacaoService notificacoes;

    @Autowired
    JdbcClient jdbc;

    private Long ana;
    private Long lucas;
    private Long rafael;

    @BeforeEach
    void prepara() {
        ana = usuario("Ana Souza", "ana@faesa.br");
        lucas = usuario("Lucas Martins", "lucas@faesa.br");
        rafael = usuario("Rafael Costa", "rafael@faesa.br");
    }

    private Long usuario(String nome, String email) {
        return jdbc.sql("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, 'x') RETURNING id")
                .params(nome, email).query(Long.class).single();
    }

    private long total(Long destinatario) {
        return jdbc.sql("SELECT count(*) FROM notificacoes WHERE destinatario_id = ?").param(destinatario)
                .query(Long.class).single();
    }

    @Test
    void repetirAMesmaChaveNaoLidaAtualizaEmVezDeDuplicar() {
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 10L, "primeiro");
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 10L, "segundo");

        assertThat(total(lucas)).isEqualTo(1);
        assertThat(jdbc.sql("SELECT texto FROM notificacoes WHERE destinatario_id = ?").param(lucas)
                .query(String.class).single()).isEqualTo("segundo");

        // Depois de lida, a mesma chave gera uma nova.
        jdbc.sql("UPDATE notificacoes SET lida_em = now() WHERE destinatario_id = ?").param(lucas).update();
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 10L, "terceiro");
        assertThat(total(lucas)).isEqualTo(2);
    }

    @Test
    void chavePorAtorSeparaCandidatosDaMesmaOportunidade() {
        notificacoes.notificar(ana, lucas, Tipo.PARTICIPACAO_NOVA, 5L, "Lucas");
        notificacoes.notificar(ana, rafael, Tipo.PARTICIPACAO_NOVA, 5L, "Rafael");
        assertThat(total(ana)).isEqualTo(2);
    }

    @Test
    void preferenciaDesligadaNaoGravaEFaltaDeConfiguracaoContaComoLigada() {
        jdbc.sql("INSERT INTO configuracoes_usuario (usuario_id, conexoes) VALUES (?, false)").param(lucas).update();
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 1L, "x");
        assertThat(total(lucas)).isZero();

        // publicacoes continua ligada
        notificacoes.notificar(lucas, ana, Tipo.PARTICIPACAO_ACEITA, 2L, "x");
        assertThat(total(lucas)).isEqualTo(1);

        // rafael não tem linha em configuracoes_usuario
        notificacoes.notificar(rafael, ana, Tipo.CONEXAO_SOLICITADA, 3L, "x");
        assertThat(total(rafael)).isEqualTo(1);
    }

    @Test
    void tiposSemPreferenciaSaoSempreEnviados() {
        jdbc.sql("""
                INSERT INTO configuracoes_usuario (usuario_id, conexoes, publicacoes, novas_oportunidades)
                VALUES (?, false, false, false)
                """).param(lucas).update();
        notificacoes.notificar(lucas, ana, Tipo.OPORTUNIDADE_REMOVIDA, 1L, "x");
        assertThat(total(lucas)).isEqualTo(1);
    }

    @Test
    void atorIgualAoDestinatarioEIgnorado() {
        notificacoes.notificar(ana, ana, Tipo.CONEXAO_ACEITA, 1L, "x");
        assertThat(total(ana)).isZero();
    }

    @Test
    void removerApagaSoANaoLida() {
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 1L, "x");
        jdbc.sql("UPDATE notificacoes SET lida_em = now() WHERE destinatario_id = ?").param(lucas).update();
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 1L, "x");

        notificacoes.remover(lucas, NotificacaoService.chave(Tipo.CONEXAO_SOLICITADA, 1L, ana));

        assertThat(jdbc.sql("SELECT count(*) FROM notificacoes WHERE destinatario_id = ? AND lida_em IS NOT NULL")
                .param(lucas).query(Long.class).single()).isEqualTo(1);
        assertThat(total(lucas)).isEqualTo(1);
    }

    @Test
    void textoLongoECortadoNoTamanhoDaColuna() {
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 1L, "a".repeat(500));
        assertThat(jdbc.sql("SELECT length(texto) FROM notificacoes WHERE destinatario_id = ?").param(lucas)
                .query(Integer.class).single()).isEqualTo(NotificacaoService.TAMANHO_TEXTO);
    }

    @Test
    void retencaoApagaLidasAntigasETodasMuitoAntigas() {
        String insere = """
                INSERT INTO notificacoes (destinatario_id, tipo, texto, chave, lida_em, criado_em)
                VALUES (?, 'OPORTUNIDADE_REMOVIDA', ?, ?, now() - CAST(? AS interval), now() - CAST(? AS interval))
                """;
        // lida há 31 dias: sai
        jdbc.sql(insere).params(lucas, "lida-31", "a", "31 days", "40 days").update();
        // lida há 29 dias: fica
        jdbc.sql(insere).params(lucas, "lida-29", "b", "29 days", "40 days").update();
        // não lida com 91 dias: sai
        jdbc.sql("""
                INSERT INTO notificacoes (destinatario_id, tipo, texto, chave, criado_em)
                VALUES (?, 'OPORTUNIDADE_REMOVIDA', 'nao-lida-91', 'c', now() - interval '91 days')
                """).param(lucas).update();
        // não lida com 89 dias: fica
        jdbc.sql("""
                INSERT INTO notificacoes (destinatario_id, tipo, texto, chave, criado_em)
                VALUES (?, 'OPORTUNIDADE_REMOVIDA', 'nao-lida-89', 'd', now() - interval '89 days')
                """).param(lucas).update();

        assertThat(notificacoes.limparAntigas()).isEqualTo(2);
        assertThat(jdbc.sql("SELECT texto FROM notificacoes WHERE destinatario_id = ? ORDER BY texto").param(lucas)
                .query(String.class).list()).containsExactly("lida-29", "nao-lida-89");
    }

    @Test
    void apagarUsuarioLevaAsNotificacoesComoDestinatarioEComoAtor() {
        notificacoes.notificar(lucas, ana, Tipo.CONEXAO_SOLICITADA, 1L, "de ana para lucas");
        notificacoes.notificar(ana, rafael, Tipo.CONEXAO_SOLICITADA, 2L, "de rafael para ana");
        notificacoes.notificar(rafael, lucas, Tipo.CONEXAO_SOLICITADA, 3L, "de lucas para rafael");

        jdbc.sql("DELETE FROM usuarios WHERE id = ?").param(ana).update();

        assertThat(total(lucas)).isZero();
        assertThat(total(ana)).isZero();
        assertThat(total(rafael)).isEqualTo(1);
    }
}
