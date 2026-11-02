package br.com.marketfaesa.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

// Servidor real: o MockMvc não passa pelo Tomcat, que é quem trata o X-Forwarded-For. Configuração padrão.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.limite.login.maximo=2")
class LimiteIpSemProxyTests {

    @Value("${local.server.port}")
    int porta;

    // Login que falha não grava nada no banco, então o servidor real não suja os outros testes.
    static int errarLogin(int porta, String email, String xForwardedFor) throws Exception {
        HttpRequest requisicao = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + porta + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .header("X-Forwarded-For", xForwardedFor)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\": \"%s\", \"senha\": \"senhaerrada\"}".formatted(email)))
                .build();
        try (HttpClient cliente = HttpClient.newHttpClient()) {
            return cliente.send(requisicao, HttpResponse.BodyHandlers.discarding()).statusCode();
        }
    }

    @Test
    void forjarXForwardedForNaoEscapaDoLimite() throws Exception {
        assertThat(errarLogin(porta, "forjado@faesa.br", "203.0.113.1")).isEqualTo(401);
        assertThat(errarLogin(porta, "forjado@faesa.br", "203.0.113.2")).isEqualTo(401);
        assertThat(errarLogin(porta, "forjado@faesa.br", "203.0.113.3")).isEqualTo(429);
    }
}
