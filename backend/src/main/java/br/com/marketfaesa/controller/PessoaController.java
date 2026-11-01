package br.com.marketfaesa.controller;

import static br.com.marketfaesa.controller.UsuarioController.usuarioId;

import br.com.marketfaesa.dto.PessoaResposta;
import br.com.marketfaesa.service.PessoaService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Diretório de pessoas (perfis públicos de outros usuários com as habilidades publicadas).
@RestController
@RequestMapping("/api/pessoas")
public class PessoaController {

    private final PessoaService pessoaService;

    public PessoaController(PessoaService pessoaService) {
        this.pessoaService = pessoaService;
    }

    @GetMapping
    public List<PessoaResposta> listar(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) String busca,
            @RequestParam(required = false) String categoria) {
        return pessoaService.listar(usuarioId(jwt), busca, categoria);
    }

    @GetMapping("/{id}")
    public PessoaResposta buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return pessoaService.buscar(usuarioId(jwt), id);
    }
}
