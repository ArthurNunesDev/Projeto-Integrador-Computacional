package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.NotificacaoContagem;
import br.com.marketfaesa.dto.NotificacaoResposta;
import br.com.marketfaesa.dto.NotificacoesLidasRequisicao;
import br.com.marketfaesa.service.NotificacaoService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Notificações do usuário logado. Só as próprias: marcar a de outro usuário dá 403.
@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    public NotificacaoController(NotificacaoService notificacaoService) {
        this.notificacaoService = notificacaoService;
    }

    // Mais novas primeiro. Próxima página: antesDeId = id da última recebida. 400 se limite fora de 1..50.
    @GetMapping
    public List<NotificacaoResposta> listar(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "20") int limite, @RequestParam(required = false) Long antesDeId,
            @RequestParam(defaultValue = "false") boolean naoLidas) {
        return notificacaoService.listar(usuarioId(jwt), limite, antesDeId, naoLidas);
    }

    @GetMapping("/contagem")
    public NotificacaoContagem contagem(@AuthenticationPrincipal Jwt jwt) {
        return notificacaoService.contar(usuarioId(jwt));
    }

    // 204 mesmo se já estava lida.
    @PutMapping("/{id}/lida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarLida(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        notificacaoService.marcarLida(usuarioId(jwt), id);
    }

    // Corpo opcional {ateId}: sem ele, marca todas.
    @PutMapping("/lidas")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarTodas(@AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) NotificacoesLidasRequisicao requisicao) {
        notificacaoService.marcarTodas(usuarioId(jwt), requisicao == null ? null : requisicao.ateId());
    }
}
