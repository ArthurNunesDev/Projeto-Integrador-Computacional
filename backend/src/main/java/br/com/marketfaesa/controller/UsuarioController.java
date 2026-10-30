package br.com.marketfaesa.controller;

import br.com.marketfaesa.dto.ConfiguracaoDto;
import br.com.marketfaesa.dto.ExclusaoContaRequisicao;
import br.com.marketfaesa.dto.SenhaAlteracaoRequisicao;
import br.com.marketfaesa.dto.UsuarioAtualizacaoRequisicao;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @PutMapping
    public UsuarioResposta atualizar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UsuarioAtualizacaoRequisicao requisicao) {
        return usuarioService.atualizarPerfil(usuarioId(jwt), requisicao);
    }

    // 204; 400 em "senhaAtual" se a senha atual não confere.
    @PutMapping("/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarSenha(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SenhaAlteracaoRequisicao requisicao) {
        usuarioService.alterarSenha(usuarioId(jwt), requisicao);
    }

    // 204; 400 em "senha" se a senha não confere. Depois disso o token deixa de valer (401).
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ExclusaoContaRequisicao requisicao) {
        usuarioService.excluirConta(usuarioId(jwt), requisicao);
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

    // Id do usuário logado (sub do JWT); usado também pelos outros controllers.
    static Long usuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
