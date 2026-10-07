package br.com.marketfaesa.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Preferências do usuário (1:1 com usuarios). Os padrões seguem o CONFIG_PADRAO do front.
@Entity
@Table(name = "configuracoes_usuario")
public class ConfiguracaoUsuario {

    @Id
    @Column(name = "usuario_id")
    private Long usuarioId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Convert(converter = Tema.TemaConverter.class)
    @Column(nullable = false, length = 20)
    private Tema tema = Tema.LIGHT;

    @Column(name = "perfil_publico", nullable = false)
    private boolean perfilPublico = true;

    @Column(name = "mostrar_email", nullable = false)
    private boolean mostrarEmail = false;

    @Column(name = "permitir_mensagens", nullable = false)
    private boolean permitirMensagens = true;

    @Column(name = "novas_oportunidades", nullable = false)
    private boolean novasOportunidades = true;

    @Column(nullable = false)
    private boolean mensagens = true;

    @Column(nullable = false)
    private boolean conexoes = true;

    @Column(nullable = false)
    private boolean publicacoes = true;

    @Column(name = "resumo_semanal", nullable = false)
    private boolean resumoSemanal = false;

    @Column(name = "reduzir_animacoes", nullable = false)
    private boolean reduzirAnimacoes = false;

    protected ConfiguracaoUsuario() {
    }

    public ConfiguracaoUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public Tema getTema() {
        return tema;
    }

    public void setTema(Tema tema) {
        this.tema = tema;
    }

    public boolean isPerfilPublico() {
        return perfilPublico;
    }

    public void setPerfilPublico(boolean perfilPublico) {
        this.perfilPublico = perfilPublico;
    }

    public boolean isMostrarEmail() {
        return mostrarEmail;
    }

    public void setMostrarEmail(boolean mostrarEmail) {
        this.mostrarEmail = mostrarEmail;
    }

    public boolean isPermitirMensagens() {
        return permitirMensagens;
    }

    public void setPermitirMensagens(boolean permitirMensagens) {
        this.permitirMensagens = permitirMensagens;
    }

    public boolean isNovasOportunidades() {
        return novasOportunidades;
    }

    public void setNovasOportunidades(boolean novasOportunidades) {
        this.novasOportunidades = novasOportunidades;
    }

    public boolean isMensagens() {
        return mensagens;
    }

    public void setMensagens(boolean mensagens) {
        this.mensagens = mensagens;
    }

    public boolean isConexoes() {
        return conexoes;
    }

    public void setConexoes(boolean conexoes) {
        this.conexoes = conexoes;
    }

    public boolean isPublicacoes() {
        return publicacoes;
    }

    public void setPublicacoes(boolean publicacoes) {
        this.publicacoes = publicacoes;
    }

    public boolean isResumoSemanal() {
        return resumoSemanal;
    }

    public void setResumoSemanal(boolean resumoSemanal) {
        this.resumoSemanal = resumoSemanal;
    }

    public boolean isReduzirAnimacoes() {
        return reduzirAnimacoes;
    }

    public void setReduzirAnimacoes(boolean reduzirAnimacoes) {
        this.reduzirAnimacoes = reduzirAnimacoes;
    }
}
