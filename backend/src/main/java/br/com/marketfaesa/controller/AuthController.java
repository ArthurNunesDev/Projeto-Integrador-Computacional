package br.com.marketfaesa.controller;

import br.com.marketfaesa.dto.CadastroRequisicao;
import br.com.marketfaesa.dto.LoginRequisicao;
import br.com.marketfaesa.dto.LoginResposta;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // getRemoteAddr só reflete o X-Forwarded-For quando server.forward-headers-strategy=native, e aí só o que veio
    // de um proxy confiável. Não leia o header direto: o cliente pode forjá-lo (ver application.properties).

    // 201 com o UsuarioResposta; 409 se o e-mail já existe; 400 se a validação falhar; 429 se exceder o limite.
    @PostMapping("/register")
    public ResponseEntity<UsuarioResposta> cadastrar(@Valid @RequestBody CadastroRequisicao requisicao,
            HttpServletRequest http) {
        UsuarioResposta usuario = authService.cadastrar(requisicao, http.getRemoteAddr());
        return ResponseEntity.created(URI.create("/api/usuarios/me")).body(usuario);
    }

    // 200 com {token, usuario}; 401 se o e-mail ou a senha não conferem; 429 se exceder o limite.
    @PostMapping("/login")
    public LoginResposta login(@Valid @RequestBody LoginRequisicao requisicao, HttpServletRequest http) {
        return authService.login(requisicao, http.getRemoteAddr());
    }
}
