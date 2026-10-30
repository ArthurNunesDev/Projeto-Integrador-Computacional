package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
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
class PessoaControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    ConfiguracaoUsuarioRepository configuracoes;

    private Conta eu;
    private Conta ana;
    private Conta lucas;

    @BeforeEach
    void prepara() throws Exception {
        eu = Conta.criar(mvc, "Eu Mesmo", "eu@faesa.br");
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
        publicar(ana, "React", "Tecnologia");
        publicar(lucas, "Figma", "Design");
    }

    private void publicar(Conta conta, String nome, String categoria) throws Exception {
        mvc.perform(post("/api/habilidades-publicadas").header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome": "%s", "categoria": "%s", "nivel": "AVANCADO", "descricao": "d",
                         "disponibilidade": "COLABORACOES"}""".formatted(nome, categoria)))
                .andExpect(status().isCreated());
    }

    // As consultas do diretório são SQL; o flush grava a configuração alterada pelo JPA.
    private void configurar(Conta conta, boolean perfilPublico, boolean mostrarEmail) throws Exception {
        mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"tema": "light", "perfilPublico": %s, "mostrarEmail": %s, "permitirMensagens": true,
                         "novasOportunidades": true, "mensagens": true, "conexoes": true, "publicacoes": true,
                         "resumoSemanal": false, "reduzirAnimacoes": false}""".formatted(perfilPublico, mostrarEmail)))
                .andExpect(status().isOk());
        configuracoes.flush();
    }

    @Test
    void listaOutrasPessoasComHabilidadesSemEmailNemFoto() throws Exception {
        mvc.perform(get("/api/pessoas").header("Authorization", eu.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome", contains("Ana Souza", "Lucas Martins")))
                .andExpect(jsonPath("$[0].id").value(ana.id()))
                .andExpect(jsonPath("$[0].email").value(nullValue()))
                .andExpect(jsonPath("$[0].fotoUrl").value(nullValue()))
                .andExpect(jsonPath("$[0].periodo").value(nullValue()))
                .andExpect(jsonPath("$[0].senhaHash").doesNotExist())
                .andExpect(jsonPath("$[0].habilidades[*].nome", contains("React")))
                .andExpect(jsonPath("$[0].habilidades[0].categoria").value("Tecnologia"))
                .andExpect(jsonPath("$[0].habilidades[0].nivel").value("AVANCADO"));
    }

    @Test
    void filtraPorBuscaECategoria() throws Exception {
        mvc.perform(get("/api/pessoas").param("busca", "figm").header("Authorization", eu.bearer()))
                .andExpect(jsonPath("$[*].nome", contains("Lucas Martins")));
        mvc.perform(get("/api/pessoas").param("busca", "ana").header("Authorization", eu.bearer()))
                .andExpect(jsonPath("$[*].nome", contains("Ana Souza")));
        mvc.perform(get("/api/pessoas").param("categoria", "Tecnologia").header("Authorization", eu.bearer()))
                .andExpect(jsonPath("$[*].nome", contains("Ana Souza")));
    }

    @Test
    void respeitaPerfilPublicoEMostrarEmail() throws Exception {
        configurar(ana, false, false);
        configurar(lucas, true, true);

        mvc.perform(get("/api/pessoas").header("Authorization", eu.bearer()))
                .andExpect(jsonPath("$[*].nome", contains("Lucas Martins")))
                .andExpect(jsonPath("$[0].email").value("lucas@faesa.br"));
        mvc.perform(get("/api/pessoas/" + ana.id()).header("Authorization", eu.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/pessoas/" + ana.id()).header("Authorization", ana.bearer()))
                .andExpect(status().isOk());
    }

    @Test
    void detalheTrazFoto() throws Exception {
        mvc.perform(put("/api/usuarios/me").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"Ana Souza\", \"periodo\": 6, \"fotoUrl\": \"data:image/png;base64,AAAA\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/pessoas/" + ana.id()).header("Authorization", eu.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ana Souza"))
                .andExpect(jsonPath("$.periodo").value(6))
                .andExpect(jsonPath("$.fotoUrl").value("data:image/png;base64,AAAA"))
                .andExpect(jsonPath("$.email").value(nullValue()))
                .andExpect(jsonPath("$.habilidades", hasSize(1)));
        mvc.perform(get("/api/pessoas/999999").header("Authorization", eu.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/pessoas")).andExpect(status().isUnauthorized());
    }
}
