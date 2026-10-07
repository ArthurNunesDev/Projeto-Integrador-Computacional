package br.com.marketfaesa.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import br.com.marketfaesa.repository.UsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UsuarioControllerTests {

    private static final String CONFIG_ALTERADA = """
            {"tema": "dark", "perfilPublico": false, "mostrarEmail": true, "permitirMensagens": false,
             "novasOportunidades": false, "mensagens": false, "conexoes": true, "publicacoes": false,
             "resumoSemanal": true, "reduzirAnimacoes": true}""";

    @Autowired
    MockMvc mvc;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    ConfiguracaoUsuarioRepository configuracoes;

    private String token;

    @BeforeEach
    void cadastraELoga() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"Diana\", \"email\": \"diana@faesa.br\", \"senha\": \"senhaforte1\"}"))
                .andExpect(status().isCreated());
        String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"diana@faesa.br\", \"senha\": \"senhaforte1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(resposta, "$.token");
    }

    private String bearer() {
        return "Bearer " + token;
    }

    @Test
    void meComTokenDevolveUsuario() throws Exception {
        mvc.perform(get("/api/usuarios/me").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Diana"))
                .andExpect(jsonPath("$.email").value("diana@faesa.br"))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty())
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }

    @Test
    void meSemTokenDevolve401() throws Exception {
        mvc.perform(get("/api/usuarios/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void meComTokenInvalidoDevolve401() throws Exception {
        mvc.perform(get("/api/usuarios/me").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenDeUsuarioApagadoDevolve401NoFormatoDeErro() throws Exception {
        usuarios.findByEmail("diana@faesa.br").ifPresent(u -> {
            configuracoes.deleteById(u.getId());
            usuarios.delete(u);
        });
        usuarios.flush();

        mvc.perform(get("/api/usuarios/me").header("Authorization", bearer()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.erro").value("Não autenticado"));
        mvc.perform(get("/api/usuarios/me/configuracoes").header("Authorization", bearer()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void configuracoesSemTokenDevolve401() throws Exception {
        mvc.perform(get("/api/usuarios/me/configuracoes")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/usuarios/me/configuracoes").contentType(MediaType.APPLICATION_JSON)
                .content(CONFIG_ALTERADA)).andExpect(status().isUnauthorized());
    }

    @Test
    void configuracoesDoNovoUsuarioSaoOPadrao() throws Exception {
        mvc.perform(get("/api/usuarios/me/configuracoes").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        {"tema": "light", "perfilPublico": true, "mostrarEmail": false, "permitirMensagens": true,
                         "novasOportunidades": true, "mensagens": true, "conexoes": true, "publicacoes": true,
                         "resumoSemanal": false, "reduzirAnimacoes": false}""", true));
    }

    @Test
    void putSubstituiAsConfiguracoesEEIdempotente() throws Exception {
        for (int i = 0; i < 2; i++) {
            mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", bearer())
                    .contentType(MediaType.APPLICATION_JSON).content(CONFIG_ALTERADA))
                    .andExpect(status().isOk())
                    .andExpect(content().json(CONFIG_ALTERADA, true));
        }
        mvc.perform(get("/api/usuarios/me/configuracoes").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(content().json(CONFIG_ALTERADA, true));
    }

    @Test
    void putComTemaInvalidoOuCampoFaltandoDevolve400() throws Exception {
        String temaInvalido = CONFIG_ALTERADA.replace("\"dark\"", "\"azul\"");
        mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content(temaInvalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.tema").exists());

        mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"tema\": \"dark\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.perfilPublico").exists());
    }
}
