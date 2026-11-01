package br.com.marketfaesa.dto;

import br.com.marketfaesa.dto.validacao.MaximoBytes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Corpo do PUT /api/usuarios/me/senha. A nova senha segue as regras do cadastro.
public record SenhaAlteracaoRequisicao(
        @NotBlank @MaximoBytes(72) String senhaAtual,
        @NotNull @Size(min = 8, max = 72) @MaximoBytes(72) String novaSenha) {
}
