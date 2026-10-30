package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.ConexaoRequisicao;
import br.com.marketfaesa.dto.ConexaoResposta;
import br.com.marketfaesa.service.ConexaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conexoes")
public class ConexaoController {

    private final ConexaoService conexaoService;

    public ConexaoController(ConexaoService conexaoService) {
        this.conexaoService = conexaoService;
    }

    // Conexões aceitas.
    @GetMapping
    public List<ConexaoResposta> listar(@AuthenticationPrincipal Jwt jwt) {
        return conexaoService.listarAceitas(usuarioId(jwt));
    }

    // Pedidos pendentes que recebi.
    @GetMapping("/recebidas")
    public List<ConexaoResposta> recebidas(@AuthenticationPrincipal Jwt jwt) {
        return conexaoService.listarRecebidas(usuarioId(jwt));
    }

    // Pedidos pendentes que enviei.
    @GetMapping("/enviadas")
    public List<ConexaoResposta> enviadas(@AuthenticationPrincipal Jwt jwt) {
        return conexaoService.listarEnviadas(usuarioId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConexaoResposta solicitar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConexaoRequisicao requisicao) {
        return conexaoService.solicitar(usuarioId(jwt), requisicao.destinatarioId());
    }

    @PostMapping("/{id}/aceitar")
    public ConexaoResposta aceitar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return conexaoService.aceitar(usuarioId(jwt), id);
    }

    @PostMapping("/{id}/recusar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recusar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        conexaoService.recusar(usuarioId(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        conexaoService.remover(usuarioId(jwt), id);
    }
}
