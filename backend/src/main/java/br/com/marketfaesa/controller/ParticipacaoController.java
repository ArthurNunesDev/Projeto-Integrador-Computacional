package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.ParticipacaoRequisicao;
import br.com.marketfaesa.dto.ParticipacaoResposta;
import br.com.marketfaesa.service.ParticipacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Candidaturas de uma oportunidade, só para o autor (403 para os demais, 404 se não existe).
@RestController
@RequestMapping("/api")
public class ParticipacaoController {

    private final ParticipacaoService participacaoService;

    public ParticipacaoController(ParticipacaoService participacaoService) {
        this.participacaoService = participacaoService;
    }

    @GetMapping("/oportunidades/{id}/participacoes")
    public List<ParticipacaoResposta> listar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return participacaoService.listar(usuarioId(jwt), id);
    }

    // {status: "ACEITA" | "RECUSADA"}. 200; 400 status inválido; 409 oportunidade fechada.
    @PatchMapping("/participacoes/{id}")
    public ParticipacaoResposta definirStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody ParticipacaoRequisicao requisicao) {
        return participacaoService.definirStatus(usuarioId(jwt), id, requisicao.status());
    }
}
