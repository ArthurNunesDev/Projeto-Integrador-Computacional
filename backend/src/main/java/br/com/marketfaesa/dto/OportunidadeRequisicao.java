package br.com.marketfaesa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

// Corpo do POST e do PUT /api/oportunidades. status é opcional: no POST nulo vira ABERTA,
// no PUT nulo mantém o atual. O PUT substitui as áreas.
public record OportunidadeRequisicao(
        @NotNull @Pattern(regexp = "PROJETO|CONSULTORIA|PESQUISA|DESIGN|FREELA|MONITORIA|AULA|DIVULGACAO",
                message = "tipo inválido") String tipo,
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank @Size(max = 5000) String descricao,
        @NotNull @Pattern(regexp = "REMOTO|HIBRIDO|PRESENCIAL", message = "modalidade inválida") String modalidade,
        @Pattern(regexp = "ABERTA|FECHADA", message = "status inválido") String status,
        @NotEmpty @Size(max = 10) List<@NotNull Long> areaIds) {

    public OportunidadeRequisicao {
        titulo = titulo == null ? null : titulo.trim();
        descricao = descricao == null ? null : descricao.trim();
    }
}
