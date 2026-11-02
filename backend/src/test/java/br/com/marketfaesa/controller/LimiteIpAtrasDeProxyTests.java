package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.LimiteIpSemProxyTests.errarLogin;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

// Configuração de produção atrás de proxy. A conexão vem de 127.0.0.1, que o Tomcat considera proxy confiável.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"app.limite.login.maximo=2", "server.forward-headers-strategy=native"})
class LimiteIpAtrasDeProxyTests {

    @Value("${local.server.port}")
    int porta;

    @Test
    void separaOsClientesPeloIpQueOProxyInformou() throws Exception {
        assertThat(errarLogin(porta, "proxy@faesa.br", "203.0.113.1")).isEqualTo(401);
        assertThat(errarLogin(porta, "proxy@faesa.br", "203.0.113.1")).isEqualTo(401);
        assertThat(errarLogin(porta, "proxy@faesa.br", "203.0.113.1")).isEqualTo(429);

        assertThat(errarLogin(porta, "proxy@faesa.br", "203.0.113.2")).isEqualTo(401);
    }

    // O proxy acrescenta o IP real no fim da lista; o que o cliente forjou fica à esquerda.
    @Test
    void ignoraOQueOClienteForjouAEsquerdaDoIpReal() throws Exception {
        assertThat(errarLogin(porta, "forjado@faesa.br", "198.51.100.1, 203.0.113.9")).isEqualTo(401);
        assertThat(errarLogin(porta, "forjado@faesa.br", "198.51.100.2, 203.0.113.9")).isEqualTo(401);
        assertThat(errarLogin(porta, "forjado@faesa.br", "198.51.100.3, 203.0.113.9")).isEqualTo(429);
    }
}
