package br.com.marketfaesa.dto;

import br.com.marketfaesa.dto.validacao.MaximoBytes;
import jakarta.validation.constraints.NotBlank;

// Corpo do DELETE /api/usuarios/me: confirma a exclusão com a senha atual.
public record ExclusaoContaRequisicao(@NotBlank @MaximoBytes(72) String senha) {
}
