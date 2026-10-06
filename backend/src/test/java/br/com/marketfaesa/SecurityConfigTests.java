package br.com.marketfaesa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import br.com.marketfaesa.model.Usuario;
import br.com.marketfaesa.repository.UsuarioRepository;
import br.com.marketfaesa.service.TokenService;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    TokenService tokenService;

    @Autowired
    UsuarioRepository usuarios;

    @Test
    void rotaProtegidaSemTokenRetorna401NoFormatoDeErro() throws Exception {
        mvc.perform(get("/api/usuarios/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.erro").isString());
    }

    @Test
    void rotaProtegidaComTokenInvalidoRetorna401() throws Exception {
        mvc.perform(get("/api/usuarios/me").header(HttpHeaders.AUTHORIZATION, "Bearer token.invalido.x"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void tokenGeradoPeloTokenServicePassaPelaAutenticacao() throws Exception {
        Usuario usuario = usuarios.save(new Usuario("Token", "token-" + System.nanoTime() + "@teste.com", "hash"));
        String token = tokenService.gerar(usuario);
        try {
            // rota protegida que nao existe: autenticado chega ao MVC e recebe 404, nao 401
            mvc.perform(get("/api/rota-inexistente").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.erro").value("Recurso não encontrado"));
        } finally {
            usuarios.delete(usuario);
        }
    }

    @Test
    void preflightCorsDoDevLocalELiberado() throws Exception {
        mvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }

    @Test
    void preflightCorsDeOrigemDesconhecidaEBarrado() throws Exception {
        mvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "https://exemplo.invalido")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void passwordEncoderFazHashEConfere() {
        String hash = encoder.encode("senha123");
        assertThat(hash).isNotEqualTo("senha123").startsWith("$2a$10$");
        assertThat(encoder.matches("senha123", hash)).isTrue();
        assertThat(encoder.matches("errada", hash)).isFalse();
    }
}
