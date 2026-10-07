package br.com.marketfaesa.dto;

import br.com.marketfaesa.model.ConfiguracaoUsuario;
import br.com.marketfaesa.model.Tema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// Configurações do usuário: o tema e os 9 booleanos do CONFIG_PADRAO (App.jsx).
// No PUT todos os campos são obrigatórios, porque o PUT substitui a configuração inteira.
public record ConfiguracaoDto(
        @NotNull @Pattern(regexp = "light|dark", message = "deve ser 'light' ou 'dark'") String tema,
        @NotNull Boolean perfilPublico,
        @NotNull Boolean mostrarEmail,
        @NotNull Boolean permitirMensagens,
        @NotNull Boolean novasOportunidades,
        @NotNull Boolean mensagens,
        @NotNull Boolean conexoes,
        @NotNull Boolean publicacoes,
        @NotNull Boolean resumoSemanal,
        @NotNull Boolean reduzirAnimacoes) {

    public static ConfiguracaoDto de(ConfiguracaoUsuario c) {
        return new ConfiguracaoDto(c.getTema().getValor(), c.isPerfilPublico(), c.isMostrarEmail(),
                c.isPermitirMensagens(), c.isNovasOportunidades(), c.isMensagens(), c.isConexoes(),
                c.isPublicacoes(), c.isResumoSemanal(), c.isReduzirAnimacoes());
    }

    public void aplicarEm(ConfiguracaoUsuario c) {
        c.setTema(Tema.deValor(tema));
        c.setPerfilPublico(perfilPublico);
        c.setMostrarEmail(mostrarEmail);
        c.setPermitirMensagens(permitirMensagens);
        c.setNovasOportunidades(novasOportunidades);
        c.setMensagens(mensagens);
        c.setConexoes(conexoes);
        c.setPublicacoes(publicacoes);
        c.setResumoSemanal(resumoSemanal);
        c.setReduzirAnimacoes(reduzirAnimacoes);
    }
}
