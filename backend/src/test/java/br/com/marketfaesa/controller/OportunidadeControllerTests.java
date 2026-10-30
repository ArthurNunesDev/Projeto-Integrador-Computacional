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

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OportunidadeControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcClient jdbc;

    private Conta autor;
    private Conta outro;
    private Long tecnologia;
    private Long saude;

    @BeforeEach
    void prepara() throws Exception {
        autor = Conta.criar(mvc, "Maria Lima", "maria@faesa.br");
        outro = Conta.criar(mvc, "Pedro Rocha", "pedro@faesa.br");
        tecnologia = area("Tecnologia");
        saude = area("Saúde");
    }

    private Long area(String nome) {
        return jdbc.sql("SELECT id FROM areas_conhecimento WHERE nome = ?").param(nome).query(Long.class).single();
    }

    private String corpo(String tipo, String titulo, String status, Long... areas) {
        String ids = String.join(", ", java.util.Arrays.stream(areas).map(String::valueOf).toList());
        return """
                {"tipo": "%s", "titulo": "%s", "descricao": "Apoio na criação de um aplicativo.",
                 "modalidade": "REMOTO", "status": %s, "areaIds": [%s]}"""
                .formatted(tipo, titulo, status == null ? "null" : "\"" + status + "\"", ids);
    }

    private ResultActions criar(Conta conta, String corpo) throws Exception {
        return mvc.perform(post("/api/oportunidades").header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private Long criarOportunidade(String tipo, String titulo, Long... areas) throws Exception {
        String resposta = criar(autor, corpo(tipo, titulo, null, areas)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    @Test
    void criarDevolve201ComAutorAreasEFlags() throws Exception {
        criar(autor, corpo("DIVULGACAO", "  App para Clínica ", null, saude, tecnologia))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/api/oportunidades/\\d+")))
                .andExpect(jsonPath("$.tipo").value("DIVULGACAO"))
                .andExpect(jsonPath("$.titulo").value("App para Clínica"))
                .andExpect(jsonPath("$.modalidade").value("REMOTO"))
                .andExpect(jsonPath("$.status").value("ABERTA"))
                .andExpect(jsonPath("$.areas[*].nome", contains("Saúde", "Tecnologia")))
                .andExpect(jsonPath("$.autor.id").value(autor.id()))
                .andExpect(jsonPath("$.autor.nome").value("Maria Lima"))
                .andExpect(jsonPath("$.autor.email").doesNotExist())
                .andExpect(jsonPath("$.participantes").value(0))
                .andExpect(jsonPath("$.participando").value(false))
                .andExpect(jsonPath("$.salva").value(false))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty());
    }

    @Test
    void criarInvalidoDevolve400ESemTokenDevolve401() throws Exception {
        criar(autor, """
                {"tipo": "DIVULGAÇÃO", "titulo": "", "descricao": "x", "modalidade": "Remoto", "areaIds": []}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.tipo").exists())
                .andExpect(jsonPath("$.campos.titulo").exists())
                .andExpect(jsonPath("$.campos.modalidade").exists())
                .andExpect(jsonPath("$.campos.areaIds").exists());

        criar(autor, corpo("PROJETO", "Projeto", null, 999_999L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.areaIds").exists());

        mvc.perform(post("/api/oportunidades").contentType(MediaType.APPLICATION_JSON)
                .content(corpo("PROJETO", "Projeto", null, tecnologia)))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/oportunidades")).andExpect(status().isUnauthorized());
    }

    @Test
    void listarFiltraPorTipoAreaStatusAutorEBusca() throws Exception {
        Long app = criarOportunidade("PROJETO", "App para Clínica", saude, tecnologia);
        Long contratos = criarOportunidade("CONSULTORIA", "Revisão de Contratos", area("Direito"));
        mvc.perform(put("/api/oportunidades/" + contratos).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo("CONSULTORIA", "Revisão de Contratos", "FECHADA", area("Direito"))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/oportunidades").header("Authorization", outro.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains(contratos.intValue(), app.intValue())));
        mvc.perform(get("/api/oportunidades").param("tipo", "PROJETO").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$[*].id", contains(app.intValue())));
        mvc.perform(get("/api/oportunidades").param("areaId", saude.toString()).header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$[*].id", contains(app.intValue())));
        mvc.perform(get("/api/oportunidades").param("status", "ABERTA").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$[*].id", contains(app.intValue())));
        mvc.perform(get("/api/oportunidades").param("busca", "contrat").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$[*].id", contains(contratos.intValue())));
        mvc.perform(get("/api/oportunidades").param("busca", "maria").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/oportunidades").param("autorId", outro.id().toString()).header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/oportunidades").param("modalidade", "PRESENCIAL").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void buscarPorIdInexistenteDevolve404() throws Exception {
        mvc.perform(get("/api/oportunidades/999999").header("Authorization", outro.bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
        mvc.perform(get("/api/oportunidades/abc").header("Authorization", outro.bearer()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void atualizarEExcluirSoPeloAutor() throws Exception {
        Long id = criarOportunidade("PROJETO", "App", tecnologia);

        mvc.perform(put("/api/oportunidades/" + id).header("Authorization", outro.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("PESQUISA", "Outro", null, tecnologia)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        mvc.perform(delete("/api/oportunidades/" + id).header("Authorization", outro.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/oportunidades/999999").header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("PESQUISA", "Outro", null, tecnologia)))
                .andExpect(status().isNotFound());

        mvc.perform(put("/api/oportunidades/" + id).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("PESQUISA", "App v2", "FECHADA", saude)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("PESQUISA"))
                .andExpect(jsonPath("$.titulo").value("App v2"))
                .andExpect(jsonPath("$.status").value("FECHADA"))
                .andExpect(jsonPath("$.areas[*].nome", contains("Saúde")));
        // status nulo no PUT mantém o atual
        mvc.perform(put("/api/oportunidades/" + id).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("PESQUISA", "App v3", null, saude)))
                .andExpect(jsonPath("$.status").value("FECHADA"));

        mvc.perform(delete("/api/oportunidades/" + id).header("Authorization", autor.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/oportunidades/" + id).header("Authorization", autor.bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void participarECancelar() throws Exception {
        Long id = criarOportunidade("PROJETO", "App", tecnologia);
        String participacao = "/api/oportunidades/" + id + "/participacao";

        mvc.perform(post(participacao).header("Authorization", autor.bearer()))
                .andExpect(status().isBadRequest());
        mvc.perform(post(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(post(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/oportunidades/" + id).header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$.participando").value(true))
                .andExpect(jsonPath("$.participantes").value(1));
        mvc.perform(get("/api/usuarios/me/participacoes").header("Authorization", outro.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains(id.intValue())))
                .andExpect(jsonPath("$[0].participando").value(true));
        mvc.perform(get("/api/usuarios/me/participacoes").header("Authorization", autor.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));

        mvc.perform(delete(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(delete(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/oportunidades/999999/participacao").header("Authorization", outro.bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void participarDeOportunidadeFechadaDevolve409() throws Exception {
        Long id = criarOportunidade("PROJETO", "App", tecnologia);
        mvc.perform(put("/api/oportunidades/" + id).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo("PROJETO", "App", "FECHADA", tecnologia)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/oportunidades/" + id + "/participacao").header("Authorization", outro.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Oportunidade fechada"));
    }

    @Test
    void salvarERemoverSaoIdempotentes() throws Exception {
        Long id = criarOportunidade("PROJETO", "App", tecnologia);
        String salvo = "/api/oportunidades/" + id + "/salvo";

        mvc.perform(put(salvo).header("Authorization", outro.bearer())).andExpect(status().isNoContent());
        mvc.perform(put(salvo).header("Authorization", outro.bearer())).andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/me/salvos").header("Authorization", outro.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains(id.intValue())))
                .andExpect(jsonPath("$[0].salva").value(true));
        mvc.perform(get("/api/oportunidades/" + id).header("Authorization", autor.bearer()))
                .andExpect(jsonPath("$.salva").value(false));

        mvc.perform(delete(salvo).header("Authorization", outro.bearer())).andExpect(status().isNoContent());
        mvc.perform(delete(salvo).header("Authorization", outro.bearer())).andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/me/salvos").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$", hasSize(0)));

        mvc.perform(put("/api/oportunidades/999999/salvo").header("Authorization", outro.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/usuarios/me/salvos")).andExpect(status().isUnauthorized());
    }
}
