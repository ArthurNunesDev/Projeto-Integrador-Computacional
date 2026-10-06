package br.com.marketfaesa.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.model.Usuario;
import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import br.com.marketfaesa.repository.UsuarioRepository;
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
class AuthControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    ConfiguracaoUsuarioRepository configuracoes;

    private ResultActions cadastrar(String nome, String email, String senha) throws Exception {
        String corpo = """
                {"nome": "%s", "email": "%s", "senha": "%s"}""".formatted(nome, email, senha);
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private ResultActions login(String email, String senha) throws Exception {
        String corpo = """
                {"email": "%s", "senha": "%s"}""".formatted(email, senha);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    @Test
    void cadastroDevolve201ComUsuarioSemSenhaECriaConfiguracaoPadrao() throws Exception {
        cadastrar("Ana Souza", "  Ana@Faesa.BR ", "senhaforte1")
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/usuarios/me"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Ana Souza"))
                .andExpect(jsonPath("$.email").value("ana@faesa.br"))
                .andExpect(jsonPath("$.curso").value(nullValue()))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist());

        Usuario salvo = usuarios.findByEmail("ana@faesa.br").orElseThrow();
        assertThat(salvo.getSenhaHash()).startsWith("$2").isNotEqualTo("senhaforte1");
        assertThat(configuracoes.findById(salvo.getId())).isPresent();
    }

    @Test
    void cadastroInvalidoDevolve400ComCampos() throws Exception {
        cadastrar("", "nao-e-email", "curta")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.erro").isNotEmpty())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void cadastroComSenhaAcimaDe72Devolve400() throws Exception {
        cadastrar("Ana", "ana@faesa.br", "a".repeat(73))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void cadastroComSenhaAcimaDe72BytesDevolve400() throws Exception {
        // 50 caracteres, mas 100 bytes em UTF-8: passaria no @Size e quebraria o BCrypt
        cadastrar("Ana", "ana@faesa.br", "é".repeat(50))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void loginComSenhaMuitoLongaDevolve401() throws Exception {
        login("ana@faesa.br", "a".repeat(200))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void cadastroComEmailRepetidoDevolve409MesmoComMaiusculas() throws Exception {
        cadastrar("Ana", "ana@faesa.br", "senhaforte1").andExpect(status().isCreated());

        cadastrar("Outra Ana", "ANA@Faesa.br", "outrasenha1")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.erro").isNotEmpty());
    }

    @Test
    void loginComCredenciaisCorretasDevolveTokenEUsuario() throws Exception {
        cadastrar("Bruno", "bruno@faesa.br", "senhaforte1").andExpect(status().isCreated());

        login("BRUNO@faesa.br", "senhaforte1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(matchesPattern("^[\\w-]+\\.[\\w-]+\\.[\\w-]+$")))
                .andExpect(jsonPath("$.usuario.email").value("bruno@faesa.br"))
                .andExpect(jsonPath("$.usuario.nome").value("Bruno"))
                .andExpect(jsonPath("$.usuario.senhaHash").doesNotExist());
    }

    @Test
    void loginComSenhaErradaOuEmailInexistenteDevolve401ComMesmaMensagem() throws Exception {
        cadastrar("Carla", "carla@faesa.br", "senhaforte1").andExpect(status().isCreated());

        String senhaErrada = login("carla@faesa.br", "senhaerrada")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andReturn().getResponse().getContentAsString();
        String emailInexistente = login("ninguem@faesa.br", "senhaforte1")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(emailInexistente).isEqualTo(senhaErrada);
    }

    @Test
    void loginSemCamposDevolve400() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }
}
