package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.HabilidadePublicadaRequisicao;
import br.com.marketfaesa.dto.HabilidadePublicadaResposta;
import br.com.marketfaesa.service.HabilidadePublicadaService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Habilidades publicadas. Listar e ver: qualquer usuário logado; alterar e excluir: só o dono.
// "Minhas publicações" = GET ?usuarioId=<meu id>.
@RestController
@RequestMapping("/api/habilidades-publicadas")
public class HabilidadePublicadaController {

    private final HabilidadePublicadaService habilidadePublicadaService;

    public HabilidadePublicadaController(HabilidadePublicadaService habilidadePublicadaService) {
        this.habilidadePublicadaService = habilidadePublicadaService;
    }

    @GetMapping
    public List<HabilidadePublicadaResposta> listar(@RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String categoria, @RequestParam(required = false) String busca) {
        return habilidadePublicadaService.listar(usuarioId, categoria, busca);
    }

    @GetMapping("/{id}")
    public HabilidadePublicadaResposta buscar(@PathVariable Long id) {
        return habilidadePublicadaService.buscar(id);
    }

    @PostMapping
    public ResponseEntity<HabilidadePublicadaResposta> criar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody HabilidadePublicadaRequisicao requisicao) {
        HabilidadePublicadaResposta criada = habilidadePublicadaService.criar(usuarioId(jwt), requisicao);
        return ResponseEntity.created(URI.create("/api/habilidades-publicadas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    public HabilidadePublicadaResposta atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody HabilidadePublicadaRequisicao requisicao) {
        return habilidadePublicadaService.atualizar(usuarioId(jwt), id, requisicao);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        habilidadePublicadaService.excluir(usuarioId(jwt), id);
    }
}
