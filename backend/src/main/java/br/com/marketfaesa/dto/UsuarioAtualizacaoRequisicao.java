package br.com.marketfaesa.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Corpo do PUT /api/usuarios/me. Substitui o perfil inteiro: campo ausente ou vazio vira null.
// fotoUrl: data URL de imagem (o front lê arquivos de até 1 MB, ~1,4 milhão de caracteres em base64) ou https.
public record UsuarioAtualizacaoRequisicao(
        @NotBlank @Size(max = 120) String nome,
        Long cursoId,
        @Min(1) @Max(20) Short periodo,
        @Size(max = 120) String cidade,
        @Size(max = 1000) String bio,
        @Size(max = 1_500_000)
        @Pattern(regexp = "(?s)(data:image/|https://).*", message = "deve ser uma data URL de imagem ou https")
        String fotoUrl) {

    public UsuarioAtualizacaoRequisicao {
        nome = nome == null ? null : nome.trim();
        cidade = vazioParaNulo(cidade);
        bio = vazioParaNulo(bio);
        fotoUrl = vazioParaNulo(fotoUrl);
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
