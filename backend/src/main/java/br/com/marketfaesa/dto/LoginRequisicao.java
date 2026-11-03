package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Corpo do POST /api/auth/login. O login é por e-mail. O tamanho máximo limita a memória do limite de tentativas,
// que guarda o e-mail na chave; é o mesmo do cadastro, então nenhuma conta fica de fora.
public record LoginRequisicao(@NotBlank @Size(max = 254) String email, @NotBlank String senha) {

    public LoginRequisicao {
        email = email == null ? null : email.trim();
    }
}
