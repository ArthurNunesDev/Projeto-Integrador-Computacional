package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class ParticipacaoControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcClient jdbc;

    private Conta autor;
    private Conta candidata;
    private Conta outro;
    private Long tecnologia;
    private Long oportunidade;

    @BeforeEach
    void prepara() throws Exception {
        autor = Conta.criar(mvc, "Maria Lima", "maria@faesa.br");
        candidata = Conta.criar(mvc, "Ana Souza", "ana@faesa.br");
        outro = Conta.criar(mvc, "Pedro Rocha", "pedro@faesa.br");
        tecnologia = jdbc.sql("SELECT id FROM areas_conhecimento WHERE nome = 'Tecnologia'").query(Long.class).single();
        oportunidade = criarOportunidade();
    }

    private String corpoOportunidade(String status) {
        return """
                {"tipo": "PROJETO", "titulo": "App", "descricao": "Apoio na criação de um aplicativo.",
                 "modalidade": "REMOTO", "status": "%s", "areaIds": [%d]}""".formatted(status, tecnologia);
    }

    private Long criarOportunidade() throws Exception {
        String resposta = mvc.perform(post("/api/oportunidades").header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpoOportunidade("ABERTA")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    private void participar(Conta conta) throws Exception {
        mvc.perform(post("/api/oportunidades/" + oportunidade + "/participacao").header("Authorization", conta.bearer()))
                .andExpect(status().isNoContent());
    }

    private ResultActions listar(Conta conta, Long id) throws Exception {
        return mvc.perform(get("/api/oportunidades/" + id + "/participacoes").header("Authorization", conta.bearer()));
    }

    private Long idDaParticipacao(Conta conta) {
        return jdbc.sql("SELECT id FROM participacoes WHERE oportunidade_id = ? AND usuario_id = ?")
                .params(oportunidade, conta.id()).query(Long.class).single();
    }

    private ResultActions definir(Conta conta, Long participacaoId, String corpo) throws Exception {
        return mvc.perform(patch("/api/participacoes/" + participacaoId).header("Authorization", conta.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private ResultActions definirStatus(Conta conta, Long participacaoId, String status) throws Exception {
        return definir(conta, participacaoId, "{\"status\": \"%s\"}".formatted(status));
    }

    private void fecharOportunidade() throws Exception {
        mvc.perform(put("/api/oportunidades/" + oportunidade).header("Authorization", autor.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(corpoOportunidade("FECHADA")))
                .andExpect(status().isOk());
    }

    @Test
    void autorListaCandidatosEmOrdemDeChegadaComPessoaResumo() throws Exception {
        participar(candidata);
        participar(outro);

        listar(autor, oportunidade)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].pessoa.nome", contains("Ana Souza", "Pedro Rocha")))
                .andExpect(jsonPath("$[0].id").value(idDaParticipacao(candidata)))
                .andExpect(jsonPath("$[0].oportunidadeId").value(oportunidade))
                .andExpect(jsonPath("$[0].status").value("PENDENTE"))
                .andExpect(jsonPath("$[0].criadoEm").isNotEmpty())
                .andExpect(jsonPath("$[0].pessoa.id").value(candidata.id()))
                .andExpect(jsonPath("$[0].pessoa.email").doesNotExist());
    }

    @Test
    void listarSoPeloAutor() throws Exception {
        participar(candidata);

        listar(candidata, oportunidade).andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
        listar(outro, oportunidade).andExpect(status().isForbidden());
        listar(autor, 999_999L).andExpect(status().isNotFound());
        mvc.perform(get("/api/oportunidades/" + oportunidade + "/participacoes")).andExpect(status().isUnauthorized());
    }

    @Test
    void autorAceitaERecusaEOCandidatoVeOProprioStatus() throws Exception {
        participar(candidata);
        participar(outro);
        Long daCandidata = idDaParticipacao(candidata);
        Long doOutro = idDaParticipacao(outro);

        definirStatus(autor, daCandidata, "ACEITA")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(daCandidata))
                .andExpect(jsonPath("$.status").value("ACEITA"))
                .andExpect(jsonPath("$.pessoa.nome").value("Ana Souza"));
        definirStatus(autor, doOutro, "RECUSADA")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECUSADA"));

        mvc.perform(get("/api/oportunidades/" + oportunidade).header("Authorization", candidata.bearer()))
                .andExpect(jsonPath("$.minhaParticipacao").value("ACEITA"))
                .andExpect(jsonPath("$.participando").value(true));
        mvc.perform(get("/api/oportunidades").header("Authorization", outro.bearer()))
                .andExpect(jsonPath("$[0].minhaParticipacao").value("RECUSADA"));
        mvc.perform(get("/api/usuarios/me/participacoes").header("Authorization", candidata.bearer()))
                .andExpect(jsonPath("$[0].minhaParticipacao").value("ACEITA"));
        // O autor não participa da própria oportunidade.
        mvc.perform(get("/api/oportunidades/" + oportunidade).header("Authorization", autor.bearer()))
                .andExpect(jsonPath("$.minhaParticipacao").value(nullValue()))
                .andExpect(jsonPath("$.participantes").value(2));
        listar(autor, oportunidade).andExpect(jsonPath("$[*].status", contains("ACEITA", "RECUSADA")));
    }

    @Test
    void repetirOStatusEIdempotenteEOAutorPodeMudarDeIdeia() throws Exception {
        participar(candidata);
        Long id = idDaParticipacao(candidata);

        definirStatus(autor, id, "ACEITA").andExpect(status().isOk());
        definirStatus(autor, id, "ACEITA").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACEITA"));
        definirStatus(autor, id, "RECUSADA").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RECUSADA"));
        definirStatus(autor, id, "ACEITA").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACEITA"));
    }

    @Test
    void definirStatusValidaPermissaoEExistencia() throws Exception {
        participar(candidata);
        Long id = idDaParticipacao(candidata);

        definirStatus(candidata, id, "ACEITA").andExpect(status().isForbidden());
        definirStatus(outro, id, "RECUSADA").andExpect(status().isForbidden());
        definirStatus(autor, 999_999L, "ACEITA").andExpect(status().isNotFound());
        definirStatus(autor, id, "PENDENTE")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.status").exists());
        definir(autor, id, "{}").andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.status").exists());
        mvc.perform(patch("/api/participacoes/" + id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACEITA\"}"))
                .andExpect(status().isUnauthorized());

        listar(autor, oportunidade).andExpect(jsonPath("$[0].status").value("PENDENTE"));
    }

    @Test
    void oportunidadeFechadaNaoAceitaDecisao() throws Exception {
        participar(candidata);
        Long id = idDaParticipacao(candidata);
        fecharOportunidade();

        definirStatus(autor, id, "ACEITA")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Oportunidade fechada"));
        // A lista continua disponível para o autor.
        listar(autor, oportunidade).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("PENDENTE"));
    }

    @Test
    void candidatoCancelaAceitaMasNaoCancelaNemRepeteRecusada() throws Exception {
        String participacao = "/api/oportunidades/" + oportunidade + "/participacao";
        participar(candidata);
        definirStatus(autor, idDaParticipacao(candidata), "ACEITA").andExpect(status().isOk());

        mvc.perform(delete(participacao).header("Authorization", candidata.bearer()))
                .andExpect(status().isNoContent());
        listar(autor, oportunidade).andExpect(jsonPath("$", hasSize(0)));

        participar(outro);
        definirStatus(autor, idDaParticipacao(outro), "RECUSADA").andExpect(status().isOk());
        mvc.perform(delete(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Sua participação foi recusada"));
        mvc.perform(post(participacao).header("Authorization", outro.bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Sua participação foi recusada"));
    }
}
