package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Corpo do POST e do PUT /api/habilidades-publicadas (formulário "Criar habilidade" do front).
// nome e categoria são texto livre; nível e disponibilidade são códigos.
public record HabilidadePublicadaRequisicao(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Size(max = 60) String categoria,
        @NotNull @Pattern(regexp = "INICIANTE|INTERMEDIARIO|AVANCADO|ESPECIALISTA", message = "nível inválido")
        String nivel,
        @NotBlank @Size(max = 5000) String descricao,
        @NotNull @Pattern(regexp = "PROJETOS_FREELAS|PROJETOS_ACADEMICOS|MONITORIAS_AULAS|COLABORACOES",
                message = "disponibilidade inválida") String disponibilidade) {

    public HabilidadePublicadaRequisicao {
        nome = nome == null ? null : nome.trim();
        categoria = categoria == null ? null : categoria.trim();
        descricao = descricao == null ? null : descricao.trim();
    }
}
