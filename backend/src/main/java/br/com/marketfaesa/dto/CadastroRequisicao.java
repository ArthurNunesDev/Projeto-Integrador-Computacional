package br.com.marketfaesa.dto;

import br.com.marketfaesa.dto.validacao.MaximoBytes;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Corpo do POST /api/auth/register (Login.jsx envia {nome, email, senha}).
public record CadastroRequisicao(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email @Size(max = 254) String email,
        @NotNull @Size(min = 8, max = 72) @MaximoBytes(72) String senha) {

    // Tira espaços nas pontas antes da validação. A senha fica como veio.
    public CadastroRequisicao {
        nome = nome == null ? null : nome.trim();
        email = email == null ? null : email.trim();
    }
}
