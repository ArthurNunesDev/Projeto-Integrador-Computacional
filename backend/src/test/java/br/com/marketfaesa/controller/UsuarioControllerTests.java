package br.com.marketfaesa.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.jdbc.core.simple.JdbcClient;
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

    @Autowired
    JdbcClient jdbc;

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

    private String perfil(Long cursoId, String fotoUrl) {
        return """
                {"nome": "  Diana Prado ", "cursoId": %s, "periodo": 5, "cidade": "Vitória, ES",
                 "bio": "Gosto de dados.", "fotoUrl": %s}""".formatted(cursoId, fotoUrl == null ? "null" : "\"" + fotoUrl + "\"");
    }

    @Test
    void putMeAtualizaPerfilComCursoEFoto() throws Exception {
        Long cursoId = jdbc.sql("INSERT INTO cursos (nome) VALUES ('Curso de Teste') RETURNING id").query(Long.class).single();
        String foto = "data:image/png;base64," + "A".repeat(1_000_000);

        mvc.perform(put("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content(perfil(cursoId, foto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Diana Prado"))
                .andExpect(jsonPath("$.email").value("diana@faesa.br"))
                .andExpect(jsonPath("$.curso.id").value(cursoId))
                .andExpect(jsonPath("$.curso.nome").value("Curso de Teste"))
                .andExpect(jsonPath("$.periodo").value(5))
                .andExpect(jsonPath("$.cidade").value("Vitória, ES"))
                .andExpect(jsonPath("$.bio").value("Gosto de dados."))
                .andExpect(jsonPath("$.fotoUrl").value(foto));

        // PUT substitui: campos ausentes ficam nulos
        mvc.perform(put("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"nome\": \"Diana\", \"cidade\": \"  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.curso").value(nullValue()))
                .andExpect(jsonPath("$.periodo").value(nullValue()))
                .andExpect(jsonPath("$.cidade").value(nullValue()))
                .andExpect(jsonPath("$.fotoUrl").value(nullValue()));
    }

    @Test
    void putMeInvalidoDevolve400ComCampos() throws Exception {
        mvc.perform(put("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"\", \"periodo\": 21, \"fotoUrl\": \"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.periodo").exists())
                .andExpect(jsonPath("$.campos.fotoUrl").exists());

        mvc.perform(put("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content(perfil(999_999L, null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cursoId").exists());

        mvc.perform(put("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content(perfil(null, "data:image/png;base64," + "A".repeat(1_500_000))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.fotoUrl").exists());
    }

    @Test
    void rotasDePerfilSemTokenDevolvem401() throws Exception {
        mvc.perform(put("/api/usuarios/me").contentType(MediaType.APPLICATION_JSON).content(perfil(null, null)))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/usuarios/me/senha").contentType(MediaType.APPLICATION_JSON)
                .content("{\"senhaAtual\": \"senhaforte1\", \"novaSenha\": \"novasenha1\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/usuarios/me").contentType(MediaType.APPLICATION_JSON)
                .content("{\"senha\": \"senhaforte1\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void alterarSenhaExigeSenhaAtualETrocaOLogin() throws Exception {
        mvc.perform(put("/api/usuarios/me/senha").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senhaAtual\": \"errada123\", \"novaSenha\": \"novasenha1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senhaAtual").exists());

        mvc.perform(put("/api/usuarios/me/senha").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senhaAtual\": \"senhaforte1\", \"novaSenha\": \"curta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.novaSenha").exists());

        mvc.perform(put("/api/usuarios/me/senha").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senhaAtual\": \"senhaforte1\", \"novaSenha\": \"novasenha1\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"diana@faesa.br\", \"senha\": \"senhaforte1\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"diana@faesa.br\", \"senha\": \"novasenha1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void excluirContaExigeSenhaEApagaOUsuario() throws Exception {
        mvc.perform(delete("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"senha\": \"errada123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
        assertThat(usuarios.existsByEmail("diana@faesa.br")).isTrue();

        mvc.perform(delete("/api/usuarios/me").header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"senha\": \"senhaforte1\"}"))
                .andExpect(status().isNoContent());

        assertThat(jdbc.sql("SELECT count(*) FROM usuarios WHERE email = 'diana@faesa.br'").query(Long.class).single())
                .isZero();
        mvc.perform(get("/api/usuarios/me").header("Authorization", bearer()))
                .andExpect(status().isUnauthorized());
    }
}
