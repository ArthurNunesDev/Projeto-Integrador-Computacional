package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
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
class MensagemControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    ConfiguracaoUsuarioRepository configuracoes;

    private Conta ana;
    private Conta lucas;
    private Conta rafael;

    @BeforeEach
    void prepara() throws Exception {
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
        rafael = Conta.criar(mvc, "Rafael Costa", "rafael@faesa.br");
    }

    private ResultActions abrir(Conta de, Long com) throws Exception {
        return mvc.perform(post("/api/conversas").header("Authorization", de.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"usuarioId\": " + com + "}"));
    }

    private Long conversa(Conta de, Conta com) throws Exception {
        String resposta = abrir(de, com.id()).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    private ResultActions enviar(Conta de, Long conversaId, String texto) throws Exception {
        return mvc.perform(post("/api/conversas/" + conversaId + "/mensagens").header("Authorization", de.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"texto\": \"" + texto + "\"}"));
    }

    @Test
    void abrirConversaDevolveAMesmaNosDoisSentidos() throws Exception {
        abrir(ana, lucas.id())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.pessoa.id").value(lucas.id()))
                .andExpect(jsonPath("$.pessoa.nome").value("Lucas Martins"))
                .andExpect(jsonPath("$.ultimaMensagem").value(nullValue()))
                .andExpect(jsonPath("$.naoLidas").value(0));

        Long id = conversa(ana, lucas);
        mvc.perform(post("/api/conversas").header("Authorization", lucas.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"usuarioId\": " + ana.id() + "}"))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.pessoa.id").value(ana.id()));
    }

    @Test
    void abrirInvalidoDevolve400404E401() throws Exception {
        abrir(ana, ana.id()).andExpect(status().isBadRequest());
        abrir(ana, 999_999L).andExpect(status().isNotFound());
        mvc.perform(post("/api/conversas").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.usuarioId").exists());
        mvc.perform(get("/api/conversas")).andExpect(status().isUnauthorized());
    }

    @Test
    void enviarListarEMarcarComoLidas() throws Exception {
        Long id = conversa(ana, lucas);

        enviar(ana, id, "  Oi, Lucas! ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.autorId").value(ana.id()))
                .andExpect(jsonPath("$.minha").value(true))
                .andExpect(jsonPath("$.texto").value("Oi, Lucas!"))
                .andExpect(jsonPath("$.lida").value(false))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty());
        enviar(ana, id, "Tudo bem?").andExpect(status().isCreated());

        mvc.perform(get("/api/conversas").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].pessoa.nome").value("Ana Souza"))
                .andExpect(jsonPath("$[0].naoLidas").value(2))
                .andExpect(jsonPath("$[0].ultimaMensagem.texto").value("Tudo bem?"))
                .andExpect(jsonPath("$[0].ultimaMensagem.minha").value(false));
        mvc.perform(get("/api/conversas").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[0].naoLidas").value(0));

        mvc.perform(get("/api/conversas/" + id + "/mensagens").header("Authorization", lucas.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].texto", contains("Oi, Lucas!", "Tudo bem?")))
                .andExpect(jsonPath("$[0].minha").value(false));
        mvc.perform(get("/api/conversas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[0].naoLidas").value(0));
        mvc.perform(get("/api/conversas/" + id + "/mensagens").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[0].minha").value(true))
                .andExpect(jsonPath("$[0].lida").value(true));
    }

    @Test
    void conversaDeOutrosDevolve403EInexistente404() throws Exception {
        Long id = conversa(ana, lucas);

        mvc.perform(get("/api/conversas/" + id + "/mensagens").header("Authorization", rafael.bearer()))
                .andExpect(status().isForbidden());
        enviar(rafael, id, "Oi").andExpect(status().isForbidden());
        mvc.perform(get("/api/conversas/999999/mensagens").header("Authorization", ana.bearer()))
                .andExpect(status().isNotFound());
        enviar(ana, id, " ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.texto").exists());
    }

    @Test
    void excluirContaApagaConversasEMensagens() throws Exception {
        Long id = conversa(ana, lucas);
        enviar(ana, id, "Oi").andExpect(status().isCreated());
        mvc.perform(post("/api/conexoes").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"destinatarioId\": " + lucas.id() + "}"))
                .andExpect(status().isCreated());

        mvc.perform(delete("/api/usuarios/me")
                .header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"senha\": \"senhaforte1\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/conversas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/conexoes/recebidas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void quemDesligouMensagensNaoRecebe() throws Exception {
        Long id = conversa(ana, lucas);
        mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", lucas.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"tema": "light", "perfilPublico": true, "mostrarEmail": false, "permitirMensagens": false,
                         "novasOportunidades": true, "mensagens": true, "conexoes": true, "publicacoes": true,
                         "resumoSemanal": false, "reduzirAnimacoes": false}"""))
                .andExpect(status().isOk());
        configuracoes.flush();

        abrir(rafael, lucas.id()).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.erro").value("Esta pessoa não aceita mensagens"));
        enviar(ana, id, "Oi").andExpect(status().isForbidden());
        // ele ainda pode escrever
        enviar(lucas, id, "Oi, Ana").andExpect(status().isCreated());
    }
}
