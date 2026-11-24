package br.com.marketfaesa.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

// Quais ações geram (ou apagam) notificações, ponta a ponta pela API.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NotificacaoGatilhosTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcClient jdbc;

    private Conta ana;
    private Conta lucas;
    private Conta maria;
    private Long tecnologia;

    @BeforeEach
    void prepara() throws Exception {
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
        maria = Conta.criar(mvc, "Maria Lima", "maria@faesa.br");
        tecnologia = jdbc.sql("SELECT id FROM areas_conhecimento WHERE nome = 'Tecnologia'").query(Long.class).single();
    }

    // Notificações não lidas da conta, mais novas primeiro, como "TIPO|texto".
    private List<String> naoLidas(Conta conta) {
        return jdbc.sql("""
                SELECT tipo || '|' || texto FROM notificacoes WHERE destinatario_id = ? AND lida_em IS NULL ORDER BY id DESC
                """).param(conta.id()).query(String.class).list();
    }

    private void lerTodas(Conta conta) throws Exception {
        mvc.perform(put("/api/notificacoes/lidas").header("Authorization", conta.bearer()))
                .andExpect(status().isNoContent());
    }

    private void desligar(Conta conta, String preferencia) {
        jdbc.sql("""
                INSERT INTO configuracoes_usuario (usuario_id) VALUES (?) ON CONFLICT (usuario_id) DO NOTHING
                """).param(conta.id()).update();
        jdbc.sql("UPDATE configuracoes_usuario SET " + preferencia + " = false WHERE usuario_id = ?")
                .param(conta.id()).update();
    }

    private static Long id(String json) {
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    // ---- conexões

    private Long pedirConexao(Conta de, Conta para) throws Exception {
        return id(mvc.perform(post("/api/conexoes").header("Authorization", de.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"destinatarioId\": " + para.id() + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void pedidoDeConexaoNotificaODestinatarioEAceiteNotificaOSolicitante() throws Exception {
        Long conexao = pedirConexao(ana, lucas);

        mvc.perform(get("/api/notificacoes").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("CONEXAO_SOLICITADA"))
                .andExpect(jsonPath("$[0].texto").value("Ana Souza quer se conectar com você."))
                .andExpect(jsonPath("$[0].ator.id").value(ana.id()))
                .andExpect(jsonPath("$[0].alvoId").value(conexao));
        assertThat(naoLidas(ana)).isEmpty();

        mvc.perform(post("/api/conexoes/" + conexao + "/aceitar").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk());

        assertThat(naoLidas(ana)).containsExactly("CONEXAO_ACEITA|Lucas Martins aceitou seu pedido de conexão.");
        // o pedido já respondido sai da lista de quem aceitou
        assertThat(naoLidas(lucas)).isEmpty();
    }

    @Test
    void recusarCancelarEDesfazerConexaoLimpamAsNaoLidasSemAvisar() throws Exception {
        Long recusada = pedirConexao(ana, lucas);
        mvc.perform(post("/api/conexoes/" + recusada + "/recusar").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        assertThat(naoLidas(lucas)).isEmpty();
        assertThat(naoLidas(ana)).isEmpty();

        Long cancelada = pedirConexao(ana, maria);
        mvc.perform(delete("/api/conexoes/" + cancelada).header("Authorization", ana.bearer()))
                .andExpect(status().isNoContent());
        assertThat(naoLidas(maria)).isEmpty();

        Long desfeita = pedirConexao(lucas, maria);
        mvc.perform(post("/api/conexoes/" + desfeita + "/aceitar").header("Authorization", maria.bearer()))
                .andExpect(status().isOk());
        assertThat(naoLidas(lucas)).hasSize(1);
        mvc.perform(delete("/api/conexoes/" + desfeita).header("Authorization", maria.bearer()))
                .andExpect(status().isNoContent());
        assertThat(naoLidas(lucas)).isEmpty();
    }

    @Test
    void recusarNaoApagaANotificacaoJaLida() throws Exception {
        Long conexao = pedirConexao(ana, lucas);
        lerTodas(lucas);
        mvc.perform(post("/api/conexoes/" + conexao + "/recusar").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/notificacoes").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].lida").value(true));
    }

    @Test
    void preferenciaDeConexoesDesligadaNaoNotifica() throws Exception {
        desligar(lucas, "conexoes");
        pedirConexao(ana, lucas);
        assertThat(naoLidas(lucas)).isEmpty();
    }

    // ---- oportunidades e participações

    private String corpoOportunidade(String titulo, String status) {
        return """
                {"tipo": "PROJETO", "titulo": "%s", "descricao": "Apoio na criação de um aplicativo.",
                 "modalidade": "REMOTO", "status": "%s", "areaIds": [%d]}""".formatted(titulo, status, tecnologia);
    }

    private Long criarOportunidade(Conta autor) throws Exception {
        return id(mvc.perform(post("/api/oportunidades").header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpoOportunidade("App", "ABERTA")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private void atualizar(Conta autor, Long oportunidade, String titulo, String status) throws Exception {
        mvc.perform(put("/api/oportunidades/" + oportunidade).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpoOportunidade(titulo, status)))
                .andExpect(status().isOk());
    }

    private void participar(Conta conta, Long oportunidade) throws Exception {
        mvc.perform(post("/api/oportunidades/" + oportunidade + "/participacao").header("Authorization", conta.bearer()))
                .andExpect(status().isNoContent());
    }

    private void decidir(Conta autor, Long oportunidade, Conta candidato, String status) throws Exception {
        Long participacao = jdbc.sql("SELECT id FROM participacoes WHERE oportunidade_id = ? AND usuario_id = ?")
                .params(oportunidade, candidato.id()).query(Long.class).single();
        mvc.perform(patch("/api/participacoes/" + participacao).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\": \"" + status + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void participarNotificaOAutorUmaPorCandidatoECancelarLimpa() throws Exception {
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);
        participar(lucas, oportunidade);

        mvc.perform(get("/api/notificacoes").header("Authorization", maria.bearer()))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].tipo").value("PARTICIPACAO_NOVA"))
                .andExpect(jsonPath("$[0].texto").value("Lucas Martins quer participar de 'App'."))
                .andExpect(jsonPath("$[0].ator.id").value(lucas.id()))
                .andExpect(jsonPath("$[0].alvoId").value(oportunidade));

        mvc.perform(delete("/api/oportunidades/" + oportunidade + "/participacao").header("Authorization", ana.bearer()))
                .andExpect(status().isNoContent());
        assertThat(naoLidas(maria)).containsExactly("PARTICIPACAO_NOVA|Lucas Martins quer participar de 'App'.");
    }

    @Test
    void aceitarERecusarParticipacaoNotificamOCandidatoSemDuplicar() throws Exception {
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);

        decidir(maria, oportunidade, ana, "ACEITA");
        assertThat(naoLidas(ana)).containsExactly("PARTICIPACAO_ACEITA|Sua participação em 'App' foi aceita.");
        // o autor decidiu: o "quer participar" não lido sai da lista dele
        assertThat(naoLidas(maria)).isEmpty();

        // repetir o mesmo status não notifica de novo, nem depois de lida
        lerTodas(ana);
        decidir(maria, oportunidade, ana, "ACEITA");
        assertThat(naoLidas(ana)).isEmpty();

        decidir(maria, oportunidade, ana, "RECUSADA");
        assertThat(naoLidas(ana)).containsExactly("PARTICIPACAO_RECUSADA|Sua participação em 'App' foi recusada.");

        // trocar de ideia apaga o aviso oposto ainda não lido
        decidir(maria, oportunidade, ana, "ACEITA");
        assertThat(naoLidas(ana)).containsExactly("PARTICIPACAO_ACEITA|Sua participação em 'App' foi aceita.");
        decidir(maria, oportunidade, ana, "RECUSADA");
        decidir(maria, oportunidade, ana, "ACEITA");
        assertThat(naoLidas(ana)).hasSize(1);
    }

    @Test
    void preferenciaDePublicacoesDesligadaNaoNotificaParticipacoes() throws Exception {
        desligar(maria, "publicacoes");
        desligar(ana, "publicacoes");
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);
        decidir(maria, oportunidade, ana, "ACEITA");

        assertThat(naoLidas(maria)).isEmpty();
        assertThat(naoLidas(ana)).isEmpty();
    }

    @Test
    void fecharNotificaParticipantesSoNaTransicaoDeAbertaParaFechada() throws Exception {
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);
        participar(lucas, oportunidade);
        decidir(maria, oportunidade, lucas, "RECUSADA");
        lerTodas(ana);
        lerTodas(lucas);
        lerTodas(maria);

        // editar sem fechar: nada
        atualizar(maria, oportunidade, "App novo", "ABERTA");
        assertThat(naoLidas(ana)).isEmpty();

        atualizar(maria, oportunidade, "App novo", "FECHADA");
        assertThat(naoLidas(ana)).containsExactly("OPORTUNIDADE_FECHADA|A oportunidade 'App novo' foi fechada.");
        // recusado não é participante; o autor não se notifica
        assertThat(naoLidas(lucas)).isEmpty();
        assertThat(naoLidas(maria)).isEmpty();

        // salvar de novo já fechada não repete
        lerTodas(ana);
        atualizar(maria, oportunidade, "App novo", "FECHADA");
        assertThat(naoLidas(ana)).isEmpty();

        // reabrir não notifica; fechar de novo, sim
        atualizar(maria, oportunidade, "App novo", "ABERTA");
        assertThat(naoLidas(ana)).isEmpty();
        atualizar(maria, oportunidade, "App novo", "FECHADA");
        assertThat(naoLidas(ana)).hasSize(1);
    }

    @Test
    void excluirNotificaParticipantesAntesDeApagar() throws Exception {
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);
        lerTodas(maria);

        mvc.perform(delete("/api/oportunidades/" + oportunidade).header("Authorization", maria.bearer()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/notificacoes").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("OPORTUNIDADE_REMOVIDA"))
                .andExpect(jsonPath("$[0].texto").value("A oportunidade 'App' foi removida."))
                .andExpect(jsonPath("$[0].ator.id").value(maria.id()))
                .andExpect(jsonPath("$[0].alvoId").value(oportunidade));
        assertThat(jdbc.sql("SELECT count(*) FROM participacoes WHERE oportunidade_id = ?").param(oportunidade)
                .query(Long.class).single()).isZero();
        // o aviso antigo do autor continua, mesmo com o alvo apagado
        assertThat(jdbc.sql("SELECT count(*) FROM notificacoes WHERE destinatario_id = ?").param(maria.id())
                .query(Long.class).single()).isEqualTo(1);
    }

    @Test
    void oportunidadeRemovidaIgnoraPreferencias() throws Exception {
        Long oportunidade = criarOportunidade(maria);
        participar(ana, oportunidade);
        desligar(ana, "publicacoes");
        desligar(ana, "conexoes");

        mvc.perform(delete("/api/oportunidades/" + oportunidade).header("Authorization", maria.bearer()))
                .andExpect(status().isNoContent());
        assertThat(naoLidas(ana)).hasSize(1);
    }
}
