package br.com.marketfaesa.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

// Usuário cadastrado e logado pela API, para os testes que precisam de mais de uma pessoa.
record Conta(Long id, String token) {

    static Conta criar(MockMvc mvc, String nome, String email) throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"%s\", \"email\": \"%s\", \"senha\": \"senhaforte1\"}".formatted(nome, email)))
                .andExpect(status().isCreated());
        String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\", \"senha\": \"senhaforte1\"}".formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new Conta(((Number) JsonPath.read(resposta, "$.usuario.id")).longValue(), JsonPath.read(resposta, "$.token"));
    }

    String bearer() {
        return "Bearer " + token;
    }
}
