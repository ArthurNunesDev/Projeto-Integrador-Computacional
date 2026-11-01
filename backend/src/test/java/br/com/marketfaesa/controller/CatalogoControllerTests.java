package br.com.marketfaesa.controller;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

// Catálogos são públicos e vêm populados pela migration V5.
@SpringBootTest
@AutoConfigureMockMvc
class CatalogoControllerTests {

    @Autowired
    MockMvc mvc;

    @Test
    void cursosSaoPublicosEPopulados() throws Exception {
        mvc.perform(get("/api/cursos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThan(20)))
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[*].nome", hasItems("Ciência da Computação", "Direito", "Medicina")));
    }

    @Test
    void areasTrazemAsCategoriasDoFront() throws Exception {
        mvc.perform(get("/api/areas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome",
                        hasItems("Tecnologia", "Saúde", "Direito", "Engenharia", "Administração", "Design")));
    }

    @Test
    void habilidadesFiltramPorArea() throws Exception {
        String areas = mvc.perform(get("/api/areas")).andReturn().getResponse().getContentAsString();
        Integer tecnologia = JsonPath.<java.util.List<Integer>>read(areas, "$[?(@.nome == 'Tecnologia')].id").get(0);

        mvc.perform(get("/api/habilidades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome", hasItems("React", "Figma")));
        mvc.perform(get("/api/habilidades").param("areaId", tecnologia.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome", hasItem("React")))
                .andExpect(jsonPath("$[*].areaId", everyItem(is(tecnologia))));
    }

    @Test
    void areaIdInvalidoDevolve400() throws Exception {
        mvc.perform(get("/api/habilidades").param("areaId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
