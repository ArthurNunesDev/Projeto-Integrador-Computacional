package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Corpo do POST /api/conversas/{id}/mensagens.
public record MensagemRequisicao(@NotBlank @Size(max = 2000) String texto) {

    public MensagemRequisicao {
        texto = texto == null ? null : texto.trim();
    }
}
