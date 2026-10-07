package br.com.marketfaesa.dto;

import br.com.marketfaesa.model.Usuario;
import java.time.Instant;

// Dados públicos do usuário. A senha (hash) nunca sai da API.
public record UsuarioResposta(
        Long id,
        String nome,
        String email,
        CursoResposta curso,
        Short periodo,
        String cidade,
        String bio,
        String fotoUrl,
        Instant criadoEm) {

    public static UsuarioResposta de(Usuario usuario, CursoResposta curso) {
        return new UsuarioResposta(usuario.getId(), usuario.getNome(), usuario.getEmail(), curso,
                usuario.getPeriodo(), usuario.getCidade(), usuario.getBio(), usuario.getFotoUrl(),
                usuario.getCriadoEm());
    }
}
