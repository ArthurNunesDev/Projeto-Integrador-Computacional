package br.com.marketfaesa.controller;

import br.com.marketfaesa.dto.ConfiguracaoDto;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Rotas do usuário logado. O id sai do token (sub), então não há /usuarios/{id}.
@RestController
@RequestMapping("/api/usuarios/me")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public UsuarioResposta me(@AuthenticationPrincipal Jwt jwt) {
        return usuarioService.buscarMe(usuarioId(jwt));
    }

    @GetMapping("/configuracoes")
    public ConfiguracaoDto configuracoes(@AuthenticationPrincipal Jwt jwt) {
        return usuarioService.buscarConfiguracoes(usuarioId(jwt));
    }

    @PutMapping("/configuracoes")
    public ConfiguracaoDto atualizarConfiguracoes(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConfiguracaoDto configuracao) {
        return usuarioService.atualizarConfiguracoes(usuarioId(jwt), configuracao);
    }

    private static Long usuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
