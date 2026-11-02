package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
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
class HabilidadePublicadaControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    ConfiguracaoUsuarioRepository configuracoes;

    private Conta ana;
    private Conta lucas;

    @BeforeEach
    void prepara() throws Exception {
        ana = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        lucas = Conta.criar(mvc, "Lucas Martins", "lucas@faesa.br");
    }

    private static String corpo(String nome, String categoria, String nivel) {
        return """
                {"nome": "%s", "categoria": "%s", "nivel": "%s", "descricao": "Interfaces com React.",
                 "disponibilidade": "PROJETOS_FREELAS"}""".formatted(nome, categoria, nivel);
    }

    private ResultActions criar(Conta conta, String corpo) throws Exception {
        return mvc.perform(post("/api/habilidades-publicadas").header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private Long criarHabilidade(Conta conta, String nome, String categoria) throws Exception {
        String resposta = criar(conta, corpo(nome, categoria, "AVANCADO")).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    // As consultas de habilidades são SQL; o flush grava a configuração alterada pelo JPA.
    private void configurarPerfil(Conta conta, boolean perfilPublico) throws Exception {
        mvc.perform(put("/api/usuarios/me/configuracoes").header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"tema": "light", "perfilPublico": %s, "mostrarEmail": false, "permitirMensagens": true,
                         "novasOportunidades": true, "mensagens": true, "conexoes": true, "publicacoes": true,
                         "resumoSemanal": false, "reduzirAnimacoes": false}""".formatted(perfilPublico)))
                .andExpect(status().isOk());
        configuracoes.flush();
    }

    @Test
    void perfilPrivadoEscondeHabilidadesDaListagemDeOutrasPessoas() throws Exception {
        criarHabilidade(ana, "React", "Tecnologia");
        Long figma = criarHabilidade(lucas, "Figma", "Design");
        configurarPerfil(ana, false);

        mvc.perform(get("/api/habilidades-publicadas").header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[*].id", contains(figma.intValue())));
        mvc.perform(get("/api/habilidades-publicadas").param("usuarioId", ana.id().toString())
                .header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/habilidades-publicadas").param("categoria", "tecnologia")
                .header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
        // A descrição de corpo() cita React, então a busca acha só a habilidade pública.
        mvc.perform(get("/api/habilidades-publicadas").param("busca", "react")
                .header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[*].id", contains(figma.intValue())));
    }

    @Test
    void perfilPrivadoEscondeDetalheDaHabilidadeDeOutrasPessoas() throws Exception {
        Long react = criarHabilidade(ana, "React", "Tecnologia");
        configurarPerfil(ana, false);

        mvc.perform(get("/api/habilidades-publicadas/" + react).header("Authorization", lucas.bearer()))
                .andExpect(status().isNotFound());

        configurarPerfil(ana, true);
        mvc.perform(get("/api/habilidades-publicadas/" + react).header("Authorization", lucas.bearer()))
                .andExpect(status().isOk());
    }

    // Publicar, editar, excluir e o início dependem de o autor continuar vendo o que publicou.
    @Test
    void autorComPerfilPrivadoContinuaVendoEGerenciandoSuasHabilidades() throws Exception {
        Long figma = criarHabilidade(lucas, "Figma", "Design");
        Long react = criarHabilidade(ana, "React", "Tecnologia");
        configurarPerfil(ana, false);

        mvc.perform(get("/api/habilidades-publicadas").header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[*].id", contains(react.intValue(), figma.intValue())));
        mvc.perform(get("/api/habilidades-publicadas").param("usuarioId", ana.id().toString())
                .header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[*].id", contains(react.intValue())));
        mvc.perform(get("/api/habilidades-publicadas/" + react).header("Authorization", ana.bearer()))
                .andExpect(status().isOk());

        criar(ana, corpo("Vue", "Tecnologia", "INICIANTE"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Vue"));
        mvc.perform(put("/api/habilidades-publicadas/" + react).header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("Angular", "Tecnologia", "INICIANTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Angular"));
        mvc.perform(delete("/api/habilidades-publicadas/" + react).header("Authorization", ana.bearer()))
                .andExpect(status().isNoContent());
    }

    @Test
    void criarDevolve201ComDono() throws Exception {
        criar(ana, corpo(" React ", "Tecnologia", "ESPECIALISTA"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("React"))
                .andExpect(jsonPath("$.categoria").value("Tecnologia"))
                .andExpect(jsonPath("$.nivel").value("ESPECIALISTA"))
                .andExpect(jsonPath("$.descricao").value("Interfaces com React."))
                .andExpect(jsonPath("$.disponibilidade").value("PROJETOS_FREELAS"))
                .andExpect(jsonPath("$.usuario.id").value(ana.id()))
                .andExpect(jsonPath("$.usuario.nome").value("Ana Souza"))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty());
    }

    @Test
    void criarInvalidoDevolve400ESemTokenDevolve401() throws Exception {
        criar(ana, """
                {"nome": "", "categoria": "Tecnologia", "nivel": "Intermediário", "descricao": "x",
                 "disponibilidade": "Projetos e freelas"}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.nivel").exists())
                .andExpect(jsonPath("$.campos.disponibilidade").exists());

        mvc.perform(post("/api/habilidades-publicadas").contentType(MediaType.APPLICATION_JSON)
                .content(corpo("React", "Tecnologia", "AVANCADO")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/habilidades-publicadas")).andExpect(status().isUnauthorized());
    }

    @Test
    void listarFiltraPorUsuarioCategoriaEBusca() throws Exception {
        Long react = criarHabilidade(ana, "React", "Tecnologia");
        Long figma = criarHabilidade(lucas, "Figma", "Design");

        mvc.perform(get("/api/habilidades-publicadas").header("Authorization", ana.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains(figma.intValue(), react.intValue())));
        mvc.perform(get("/api/habilidades-publicadas").param("usuarioId", ana.id().toString())
                .header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[*].id", contains(react.intValue())));
        mvc.perform(get("/api/habilidades-publicadas").param("categoria", "design")
                .header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$[*].id", contains(figma.intValue())));
        mvc.perform(get("/api/habilidades-publicadas").param("busca", "figm")
                .header("Authorization", lucas.bearer()))
                .andExpect(jsonPath("$[*].id", contains(figma.intValue())));
        mvc.perform(get("/api/habilidades-publicadas/" + figma).header("Authorization", ana.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.id").value(lucas.id()));
        mvc.perform(get("/api/habilidades-publicadas/999999").header("Authorization", ana.bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void atualizarEExcluirSoPeloDono() throws Exception {
        Long id = criarHabilidade(ana, "React", "Tecnologia");
        String url = "/api/habilidades-publicadas/" + id;

        mvc.perform(put(url).header("Authorization", lucas.bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(corpo("Vue", "Tecnologia", "INICIANTE")))
                .andExpect(status().isForbidden());
        mvc.perform(delete(url).header("Authorization", lucas.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/habilidades-publicadas/999999").header("Authorization", ana.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("Vue", "Tecnologia", "INICIANTE")))
                .andExpect(status().isNotFound());

        mvc.perform(put(url).header("Authorization", ana.bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(corpo("Vue", "Tecnologia", "INICIANTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Vue"))
                .andExpect(jsonPath("$.nivel").value("INICIANTE"));

        mvc.perform(delete(url).header("Authorization", ana.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/habilidades-publicadas").param("usuarioId", ana.id().toString())
                .header("Authorization", ana.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
