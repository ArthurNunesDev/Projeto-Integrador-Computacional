package br.com.marketfaesa.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.service.NotificacaoService;
import br.com.marketfaesa.service.NotificacaoService.Tipo;
import com.jayway.jsonpath.JsonPath;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NotificacaoControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    NotificacaoService notificacoes;

    @Autowired
    JdbcClient jdbc;

    private Conta ana;
    private Conta lucas;

    @BeforeEach
    void prepara() throws Exception {
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
    }

    // n notificações para lucas, de ana, com alvos 1..n; devolve os ids em ordem de criação.
    private List<Long> criar(int n) {
        for (long alvo = 1; alvo <= n; alvo++) {
            notificacoes.notificar(lucas.id(), ana.id(), Tipo.CONEXAO_SOLICITADA, alvo, "Notificação " + alvo);
        }
        return jdbc.sql("SELECT id FROM notificacoes WHERE destinatario_id = ? ORDER BY id").param(lucas.id())
                .query(Long.class).list();
    }

    private ResultActions listar(Conta conta, String query) throws Exception {
        return mvc.perform(get("/api/notificacoes" + query).header("Authorization", conta.bearer()));
    }

    private List<Long> ids(ResultActions resultado) throws Exception {
        List<Number> lidos = JsonPath.read(resultado.andReturn().getResponse().getContentAsString(), "$[*].id");
        return lidos.stream().map(Number::longValue).toList();
    }

    @Test
    void listaComFormatoDoContratoMaisNovasPrimeiro() throws Exception {
        criar(2);
        notificacoes.notificar(lucas.id(), null, Tipo.OPORTUNIDADE_REMOVIDA, 9L, "Sem ator");

        listar(lucas, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].texto", contains("Sem ator", "Notificação 2", "Notificação 1")))
                .andExpect(jsonPath("$[0].tipo").value("OPORTUNIDADE_REMOVIDA"))
                .andExpect(jsonPath("$[0].ator").value(nullValue()))
                .andExpect(jsonPath("$[0].alvoId").value(9))
                .andExpect(jsonPath("$[0].lida").value(false))
                .andExpect(jsonPath("$[0].criadoEm").isNotEmpty())
                .andExpect(jsonPath("$[1].tipo").value("CONEXAO_SOLICITADA"))
                .andExpect(jsonPath("$[1].ator.id").value(ana.id()))
                .andExpect(jsonPath("$[1].ator.nome").value("Ana Souza"))
                .andExpect(jsonPath("$[1].ator.email").doesNotExist());

        listar(ana, "").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void cursorPaginaSemRepetirNemPular() throws Exception {
        List<Long> criados = criar(5);

        List<Long> vistos = new ArrayList<>();
        List<Long> pagina = ids(listar(lucas, "?limite=2").andExpect(status().isOk()));
        while (!pagina.isEmpty()) {
            vistos.addAll(pagina);
            pagina = ids(listar(lucas, "?limite=2&antesDeId=" + pagina.get(pagina.size() - 1)));
        }

        assertThat(vistos).containsExactlyElementsOf(criados.reversed());
    }

    @Test
    void limiteForaDaFaixaDevolve400() throws Exception {
        listar(lucas, "?limite=0").andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.limite").exists());
        listar(lucas, "?limite=51").andExpect(status().isBadRequest());
        listar(lucas, "?limite=abc").andExpect(status().isBadRequest());
        listar(lucas, "?limite=50").andExpect(status().isOk());
    }

    @Test
    void filtroNaoLidasEMarcarUmaComoLida() throws Exception {
        List<Long> criados = criar(2);
        Long primeira = criados.get(0);

        mvc.perform(put("/api/notificacoes/" + primeira + "/lida").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        // idempotente
        mvc.perform(put("/api/notificacoes/" + primeira + "/lida").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());

        listar(lucas, "?naoLidas=true").andExpect(jsonPath("$[*].id", contains(criados.get(1).intValue())));
        listar(lucas, "").andExpect(jsonPath("$[1].lida").value(true));
    }

    @Test
    void marcarDeOutroUsuarioDevolve403EInexistente404() throws Exception {
        Long id = criar(1).get(0);

        mvc.perform(put("/api/notificacoes/" + id + "/lida").header("Authorization", ana.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        mvc.perform(put("/api/notificacoes/999999/lida").header("Authorization", lucas.bearer()))
                .andExpect(status().isNotFound());
        listar(lucas, "?naoLidas=true").andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void semTokenDevolve401() throws Exception {
        mvc.perform(get("/api/notificacoes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/notificacoes/contagem")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/notificacoes/1/lida")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/notificacoes/lidas")).andExpect(status().isUnauthorized());
    }

    @Test
    void marcarTodasComAteIdNaoMarcaAsMaisNovas() throws Exception {
        List<Long> criados = criar(3);

        mvc.perform(put("/api/notificacoes/lidas").header("Authorization", lucas.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"ateId\": " + criados.get(1) + "}"))
                .andExpect(status().isNoContent());
        listar(lucas, "?naoLidas=true").andExpect(jsonPath("$[*].id", contains(criados.get(2).intValue())));

        // sem corpo: todas
        mvc.perform(put("/api/notificacoes/lidas").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        listar(lucas, "?naoLidas=true").andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void marcarTodasNaoAfetaOutroUsuario() throws Exception {
        criar(1);
        notificacoes.notificar(ana.id(), lucas.id(), Tipo.CONEXAO_ACEITA, 1L, "para ana");

        mvc.perform(put("/api/notificacoes/lidas").header("Authorization", lucas.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/notificacoes/contagem").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$.naoLidas").value(1));
    }

    @Test
    void contagemSomaNaoLidasEMensagensRecebidasNaoLidas() throws Exception {
        criar(2);
        String resposta = mvc.perform(post("/api/conversas").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"usuarioId\": " + lucas.id() + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long conversa = ((Number) JsonPath.read(resposta, "$.id")).longValue();
        for (String texto : List.of("oi", "tudo bem?")) {
            mvc.perform(post("/api/conversas/" + conversa + "/mensagens").header("Authorization", ana.bearer())
                    .contentType(MediaType.APPLICATION_JSON).content("{\"texto\": \"" + texto + "\"}"))
                    .andExpect(status().isCreated());
        }
        mvc.perform(post("/api/conversas/" + conversa + "/mensagens").header("Authorization", lucas.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"texto\": \"oi!\"}"))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/notificacoes/contagem").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.naoLidas").value(2))
                .andExpect(jsonPath("$.mensagensNaoLidas").value(2));
        // a mensagem que ana recebeu conta para ela; as que ela mandou, não
        mvc.perform(get("/api/notificacoes/contagem").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$.naoLidas").value(0))
                .andExpect(jsonPath("$.mensagensNaoLidas").value(1));

        // abrir a conversa marca as mensagens como lidas
        mvc.perform(get("/api/conversas/" + conversa + "/mensagens").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk());
        mvc.perform(get("/api/notificacoes/contagem").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$.mensagensNaoLidas").value(0));
    }
}
