package br.com.marketfaesa.controller;

import br.com.marketfaesa.dto.CadastroRequisicao;
import br.com.marketfaesa.dto.LoginRequisicao;
import br.com.marketfaesa.dto.LoginResposta;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.service.AuthService;
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

    // 201 com o UsuarioResposta; 409 se o e-mail já existe; 400 se a validação falhar.
    @PostMapping("/register")
    public ResponseEntity<UsuarioResposta> cadastrar(@Valid @RequestBody CadastroRequisicao requisicao) {
        UsuarioResposta usuario = authService.cadastrar(requisicao);
        return ResponseEntity.created(URI.create("/api/usuarios/me")).body(usuario);
    }

    // 200 com {token, usuario}; 401 se o e-mail ou a senha não conferem.
    @PostMapping("/login")
    public LoginResposta login(@Valid @RequestBody LoginRequisicao requisicao) {
        return authService.login(requisicao);
    }
}
