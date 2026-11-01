package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConexaoControllerTests {

    @Autowired
    MockMvc mvc;

    private Conta ana;
    private Conta lucas;
    private Conta rafael;

    @BeforeEach
    void prepara() throws Exception {
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
        rafael = Conta.criar(mvc, "Rafael Costa", "rafael@faesa.br");
    }

    private ResultActions solicitar(Conta de, Long para) throws Exception {
        return mvc.perform(post("/api/conexoes").header("Authorization", de.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"destinatarioId\": " + para + "}"));
    }

    private Long pedido(Conta de, Conta para) throws Exception {
        String resposta = solicitar(de, para.id()).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    @Test
    void solicitarDevolve201EApareceEmEnviadasERecebidas() throws Exception {
        solicitar(ana, lucas.id())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.enviadaPorMim").value(true))
                .andExpect(jsonPath("$.pessoa.id").value(lucas.id()))
                .andExpect(jsonPath("$.pessoa.nome").value("Lucas Martins"))
                .andExpect(jsonPath("$.pessoa.email").doesNotExist());

        mvc.perform(get("/api/conexoes/enviadas").header("Authorization", ana.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].pessoa.nome", contains("Lucas Martins")));
        mvc.perform(get("/api/conexoes/recebidas").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].pessoa.nome", contains("Ana Souza")))
                .andExpect(jsonPath("$[0].enviadaPorMim").value(false));
        mvc.perform(get("/api/conexoes/recebidas").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/conexoes").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void solicitarInvalidoDevolve400404409E401() throws Exception {
        solicitar(ana, ana.id()).andExpect(status().isBadRequest());
        solicitar(ana, 999_999L).andExpect(status().isNotFound());
        mvc.perform(post("/api/conexoes").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.destinatarioId").exists());

        pedido(ana, lucas);
        solicitar(ana, lucas.id()).andExpect(status().isConflict());
        // o par invertido também conflita
        solicitar(lucas, ana.id()).andExpect(status().isConflict());

        mvc.perform(post("/api/conexoes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"destinatarioId\": " + lucas.id() + "}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/conexoes")).andExpect(status().isUnauthorized());
    }

    @Test
    void aceitarSoPeloDestinatarioEListaNosDoisLados() throws Exception {
        Long id = pedido(ana, lucas);

        mvc.perform(post("/api/conexoes/" + id + "/aceitar").header("Authorization", ana.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/conexoes/" + id + "/aceitar").header("Authorization", rafael.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/conexoes/999999/aceitar").header("Authorization", lucas.bearer()))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/conexoes/" + id + "/aceitar").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEITA"))
                .andExpect(jsonPath("$.pessoa.id").value(ana.id()));
        mvc.perform(post("/api/conexoes/" + id + "/aceitar").header("Authorization", lucas.bearer()))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/conexoes").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[*].pessoa.nome", contains("Lucas Martins")));
        mvc.perform(get("/api/conexoes").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[*].pessoa.nome", contains("Ana Souza")));
        mvc.perform(get("/api/conexoes/recebidas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void recusarApagaOPedidoEPermitePedirDeNovo() throws Exception {
        Long id = pedido(ana, lucas);

        mvc.perform(post("/api/conexoes/" + id + "/recusar").header("Authorization", ana.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/conexoes/" + id + "/recusar").header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/conexoes/recebidas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));

        solicitar(ana, lucas.id()).andExpect(status().isCreated());
    }

    @Test
    void removerPorQualquerLadoEBloqueadoParaTerceiros() throws Exception {
        Long id = pedido(ana, lucas);
        mvc.perform(post("/api/conexoes/" + id + "/aceitar").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/conexoes/" + id).header("Authorization", rafael.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/conexoes/" + id).header("Authorization", lucas.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/conexoes/" + id).header("Authorization", lucas.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/conexoes").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));

        // cancelar o próprio pedido pendente
        Long pedido = pedido(ana, rafael);
        mvc.perform(delete("/api/conexoes/" + pedido).header("Authorization", ana.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/conexoes/enviadas").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
