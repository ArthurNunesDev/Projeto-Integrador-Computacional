package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

// Os contadores sobrevivem entre os testes (contexto compartilhado): cada teste usa os próprios IPs.
@SpringBootTest(properties = {
        "app.limite.login.maximo=3", "app.limite.login.janela=15m",
        "app.limite.cadastro.maximo=2", "app.limite.cadastro.janela=1h"})
@AutoConfigureMockMvc
@Transactional
class AuthLimiteTentativasTests {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    Clock relogio;

    Instant agora = Instant.parse("2026-01-01T00:00:00Z");

    @BeforeEach
    void configurarRelogio() {
        when(relogio.instant()).thenAnswer(chamada -> agora);
    }

    private ResultActions cadastrar(String ip, String email) throws Exception {
        String corpo = """
                {"nome": "Ana", "email": "%s", "senha": "senhaforte1"}""".formatted(email);
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(corpo)
                .with(requisicao -> {
                    requisicao.setRemoteAddr(ip);
                    return requisicao;
                }));
    }

    private ResultActions login(String ip, String email, String senha) throws Exception {
        String corpo = """
                {"email": "%s", "senha": "%s"}""".formatted(email, senha);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(corpo)
                .with(requisicao -> {
                    requisicao.setRemoteAddr(ip);
                    return requisicao;
                }));
    }

    private void errarLoginAteOLimite(String ip, String email) throws Exception {
        for (int i = 0; i < 3; i++) {
            login(ip, email, "senhaerrada").andExpect(status().isUnauthorized());
        }
    }

    @Test
    void loginAcimaDoLimiteDevolve429NoFormatoDeErroMesmoComSenhaCerta() throws Exception {
        cadastrar("10.1.0.1", "bloqueada@faesa.br").andExpect(status().isCreated());
        errarLoginAteOLimite("10.1.0.2", "bloqueada@faesa.br");

        login("10.1.0.2", "bloqueada@faesa.br", "senhaforte1")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.erro").value("Muitas tentativas. Tente novamente em 15 minutos."));
    }

    @Test
    void limiteDeLoginValeTambemParaEmailInexistente() throws Exception {
        errarLoginAteOLimite("10.2.0.1", "ninguem@faesa.br");

        login("10.2.0.1", "ninguem@faesa.br", "senhaerrada").andExpect(status().isTooManyRequests());
    }

    // Sem o header de CORS o navegador esconde a resposta e o front mostraria "falha de rede" no lugar da mensagem.
    @Test
    void respostaDe429TemCorsParaOFrontLerAMensagem() throws Exception {
        errarLoginAteOLimite("10.2.1.1", "cors@faesa.br");

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"cors@faesa.br\", \"senha\": \"senhaerrada\"}")
                .header("Origin", "http://localhost:5173")
                .with(requisicao -> {
                    requisicao.setRemoteAddr("10.2.1.1");
                    return requisicao;
                }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void limiteDeLoginEPorParDeIpEEmail() throws Exception {
        errarLoginAteOLimite("10.3.0.1", "alvo@faesa.br");
        login("10.3.0.1", "alvo@faesa.br", "senhaerrada").andExpect(status().isTooManyRequests());

        // A vítima, de outro IP, não é afetada; o atacante continua livre para outros e-mails.
        login("10.3.0.2", "alvo@faesa.br", "senhaerrada").andExpect(status().isUnauthorized());
        login("10.3.0.1", "outro@faesa.br", "senhaerrada").andExpect(status().isUnauthorized());
    }

    @Test
    void limiteDeLoginNaoSeBurlaMudandoMaiusculasDoEmail() throws Exception {
        errarLoginAteOLimite("10.4.0.1", "maiusculas@faesa.br");

        login("10.4.0.1", "  MAIUSCULAS@Faesa.BR ", "senhaerrada").andExpect(status().isTooManyRequests());
    }

    @Test
    void loginLiberaSoAposAJanela() throws Exception {
        errarLoginAteOLimite("10.5.0.1", "espera@faesa.br");

        agora = agora.plus(Duration.ofMinutes(15)).minusSeconds(1);
        login("10.5.0.1", "espera@faesa.br", "senhaerrada")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.erro", containsString("1 minuto.")));

        agora = agora.plusSeconds(1);
        login("10.5.0.1", "espera@faesa.br", "senhaerrada").andExpect(status().isUnauthorized());
    }

    @Test
    void loginCertoNaoConsomeELimpaOsErrosAnteriores() throws Exception {
        cadastrar("10.6.0.1", "certa@faesa.br").andExpect(status().isCreated());

        for (int i = 0; i < 5; i++) {
            login("10.6.0.2", "certa@faesa.br", "senhaerrada").andExpect(status().isUnauthorized());
            login("10.6.0.2", "certa@faesa.br", "senhaerrada").andExpect(status().isUnauthorized());
            login("10.6.0.2", "certa@faesa.br", "senhaforte1").andExpect(status().isOk());
        }
    }

    @Test
    void cadastroAcimaDoLimiteDevolve429PorIpEContaEmailRepetido() throws Exception {
        cadastrar("10.7.0.1", "nova@faesa.br").andExpect(status().isCreated());
        cadastrar("10.7.0.1", "nova@faesa.br").andExpect(status().isConflict());

        cadastrar("10.7.0.1", "terceira@faesa.br")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.erro").value("Muitas tentativas. Tente novamente em 60 minutos."));

        cadastrar("10.7.0.2", "terceira@faesa.br").andExpect(status().isCreated());
    }

    @Test
    void cadastroInvalidoNaoConsomeOLimite() throws Exception {
        for (int i = 0; i < 3; i++) {
            cadastrar("10.8.0.1", "nao-e-email").andExpect(status().isBadRequest());
        }

        cadastrar("10.8.0.1", "valida@faesa.br").andExpect(status().isCreated());
    }

    @Test
    void cadastroLiberaAposAJanela() throws Exception {
        cadastrar("10.9.0.1", "janela1@faesa.br").andExpect(status().isCreated());
        cadastrar("10.9.0.1", "janela2@faesa.br").andExpect(status().isCreated());
        cadastrar("10.9.0.1", "janela3@faesa.br").andExpect(status().isTooManyRequests());

        agora = agora.plus(Duration.ofHours(1));
        cadastrar("10.9.0.1", "janela3@faesa.br").andExpect(status().isCreated());
    }
}
