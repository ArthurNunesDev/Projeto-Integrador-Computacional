package br.com.marketfaesa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    PasswordEncoder encoder;

    @Test
    void rotaSemAutenticacaoRetorna401() throws Exception {
        mvc.perform(get("/qualquer-rota")).andExpect(status().isUnauthorized());
    }

    @Test
    void passwordEncoderFazHashEConfere() {
        String hash = encoder.encode("senha123");
        assertThat(hash).isNotEqualTo("senha123");
        assertThat(encoder.matches("senha123", hash)).isTrue();
        assertThat(encoder.matches("errada", hash)).isFalse();
    }
}
