package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotBlank;

// Corpo do POST /api/auth/login. O login é por e-mail.
public record LoginRequisicao(@NotBlank String email, @NotBlank String senha) {

    public LoginRequisicao {
        email = email == null ? null : email.trim();
    }
}
