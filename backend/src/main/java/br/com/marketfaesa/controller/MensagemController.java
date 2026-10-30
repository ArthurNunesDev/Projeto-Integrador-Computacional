package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.ConversaRequisicao;
import br.com.marketfaesa.dto.ConversaResposta;
import br.com.marketfaesa.dto.MensagemRequisicao;
import br.com.marketfaesa.dto.MensagemResposta;
import br.com.marketfaesa.service.MensagemService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Conversas e mensagens do usuário logado (403 em conversa de outras pessoas).
@RestController
@RequestMapping("/api/conversas")
public class MensagemController {

    private final MensagemService mensagemService;

    public MensagemController(MensagemService mensagemService) {
        this.mensagemService = mensagemService;
    }

    @GetMapping
    public List<ConversaResposta> conversas(@AuthenticationPrincipal Jwt jwt) {
        return mensagemService.listarConversas(usuarioId(jwt));
    }

    // 200 com a conversa (nova ou a que já existia com a pessoa).
    @PostMapping
    public ConversaResposta abrir(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConversaRequisicao requisicao) {
        return mensagemService.abrir(usuarioId(jwt), requisicao.usuarioId());
    }

    @GetMapping("/{id}/mensagens")
    public List<MensagemResposta> mensagens(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return mensagemService.listarMensagens(usuarioId(jwt), id);
    }

    @PostMapping("/{id}/mensagens")
    @ResponseStatus(HttpStatus.CREATED)
    public MensagemResposta enviar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody MensagemRequisicao requisicao) {
        return mensagemService.enviar(usuarioId(jwt), id, requisicao.texto());
    }
}
