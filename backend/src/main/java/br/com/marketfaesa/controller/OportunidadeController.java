package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.OportunidadeRequisicao;
import br.com.marketfaesa.dto.OportunidadeResposta;
import br.com.marketfaesa.service.OportunidadeService;
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

// Oportunidades. Alterar e excluir só pelo autor (403 para os demais, 404 se não existe).
@RestController
@RequestMapping("/api")
public class OportunidadeController {

    private final OportunidadeService oportunidadeService;

    public OportunidadeController(OportunidadeService oportunidadeService) {
        this.oportunidadeService = oportunidadeService;
    }

    @GetMapping("/oportunidades")
    public List<OportunidadeResposta> listar(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) String modalidade,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long autorId,
            @RequestParam(required = false) String busca) {
        return oportunidadeService.listar(usuarioId(jwt), tipo, areaId, modalidade, status, autorId, busca);
    }

    @GetMapping("/oportunidades/{id}")
    public OportunidadeResposta buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return oportunidadeService.buscar(usuarioId(jwt), id);
    }

    @PostMapping("/oportunidades")
    public ResponseEntity<OportunidadeResposta> criar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody OportunidadeRequisicao requisicao) {
        OportunidadeResposta criada = oportunidadeService.criar(usuarioId(jwt), requisicao);
        return ResponseEntity.created(URI.create("/api/oportunidades/" + criada.id())).body(criada);
    }

    @PutMapping("/oportunidades/{id}")
    public OportunidadeResposta atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody OportunidadeRequisicao requisicao) {
        return oportunidadeService.atualizar(usuarioId(jwt), id, requisicao);
    }

    @DeleteMapping("/oportunidades/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        oportunidadeService.excluir(usuarioId(jwt), id);
    }

    // 204; 400 na própria oportunidade; 409 se fechada ou se já participa.
    @PostMapping("/oportunidades/{id}/participacao")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void participar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        oportunidadeService.participar(usuarioId(jwt), id);
    }

    // 204; 404 se não participa.
    @DeleteMapping("/oportunidades/{id}/participacao")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelarParticipacao(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        oportunidadeService.cancelarParticipacao(usuarioId(jwt), id);
    }

    @PutMapping("/oportunidades/{id}/salvo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void salvar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        oportunidadeService.salvar(usuarioId(jwt), id);
    }

    @DeleteMapping("/oportunidades/{id}/salvo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerSalva(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        oportunidadeService.removerSalva(usuarioId(jwt), id);
    }

    @GetMapping("/usuarios/me/participacoes")
    public List<OportunidadeResposta> participacoes(@AuthenticationPrincipal Jwt jwt) {
        return oportunidadeService.listarParticipacoes(usuarioId(jwt));
    }

    @GetMapping("/usuarios/me/salvos")
    public List<OportunidadeResposta> salvas(@AuthenticationPrincipal Jwt jwt) {
        return oportunidadeService.listarSalvas(usuarioId(jwt));
    }
}
