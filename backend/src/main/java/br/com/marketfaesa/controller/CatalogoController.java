package br.com.marketfaesa.controller;

import br.com.marketfaesa.dto.AreaResposta;
import br.com.marketfaesa.dto.CursoResposta;
import br.com.marketfaesa.dto.HabilidadeResposta;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Catálogos públicos (sem token), em ordem alfabética. São só leitura, então sem camada de serviço.
@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final JdbcClient jdbc;

    public CatalogoController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/cursos")
    public List<CursoResposta> cursos() {
        return jdbc.sql("SELECT id, nome FROM cursos ORDER BY nome").query(CursoResposta.class).list();
    }

    @GetMapping("/areas")
    public List<AreaResposta> areas() {
        return jdbc.sql("SELECT id, nome FROM areas_conhecimento ORDER BY nome").query(AreaResposta.class).list();
    }

    // ?areaId= filtra pela área.
    @GetMapping("/habilidades")
    public List<HabilidadeResposta> habilidades(@RequestParam(required = false) Long areaId) {
        return jdbc.sql("SELECT id, nome, area_id FROM habilidades WHERE (CAST(:areaId AS bigint) IS NULL OR area_id = :areaId) "
                + "ORDER BY nome")
                .param("areaId", areaId)
                .query(HabilidadeResposta.class).list();
    }
}
