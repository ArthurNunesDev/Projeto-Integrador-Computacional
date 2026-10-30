package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.ConfiguracaoDto;
import br.com.marketfaesa.dto.CursoResposta;
import br.com.marketfaesa.dto.ExclusaoContaRequisicao;
import br.com.marketfaesa.dto.SenhaAlteracaoRequisicao;
import br.com.marketfaesa.dto.UsuarioAtualizacaoRequisicao;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.error.ErroApiException;
import br.com.marketfaesa.error.UsuarioNaoEncontradoException;
import br.com.marketfaesa.model.ConfiguracaoUsuario;
import br.com.marketfaesa.model.Usuario;
import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import br.com.marketfaesa.repository.UsuarioRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Dados do usuário logado (/api/usuarios/me) e suas configurações.
@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final ConfiguracaoUsuarioRepository configuracoes;
    private final JdbcClient jdbc;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarios, ConfiguracaoUsuarioRepository configuracoes, JdbcClient jdbc,
            PasswordEncoder passwordEncoder) {
        this.usuarios = usuarios;
        this.configuracoes = configuracoes;
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UsuarioResposta buscarMe(Long usuarioId) {
        return resposta(buscarUsuario(usuarioId));
    }

    @Transactional(readOnly = true)
    public ConfiguracaoDto buscarConfiguracoes(Long usuarioId) {
        Usuario usuario = buscarUsuario(usuarioId);
        return ConfiguracaoDto.de(configuracoes.findById(usuario.getId())
                .orElseGet(() -> new ConfiguracaoUsuario(usuario)));
    }

    // PUT: substitui a configuração inteira, então repetir a mesma chamada dá o mesmo resultado.
    @Transactional
    public ConfiguracaoDto atualizarConfiguracoes(Long usuarioId, ConfiguracaoDto nova) {
        Usuario usuario = buscarUsuario(usuarioId);
        ConfiguracaoUsuario configuracao = configuracoes.findById(usuario.getId())
                .orElseGet(() -> new ConfiguracaoUsuario(usuario));
        nova.aplicarEm(configuracao);
        return ConfiguracaoDto.de(configuracoes.save(configuracao));
    }

    // PUT: substitui os campos do perfil. O e-mail (login) não muda aqui.
    @Transactional
    public UsuarioResposta atualizarPerfil(Long usuarioId, UsuarioAtualizacaoRequisicao requisicao) {
        Usuario usuario = buscarUsuario(usuarioId);
        if (requisicao.cursoId() != null && !jdbc.sql("SELECT EXISTS (SELECT 1 FROM cursos WHERE id = ?)")
                .param(requisicao.cursoId()).query(Boolean.class).single()) {
            throw ErroApiException.campoInvalido("cursoId", "curso não encontrado");
        }
        usuario.setNome(requisicao.nome());
        usuario.setCursoId(requisicao.cursoId());
        usuario.setPeriodo(requisicao.periodo());
        usuario.setCidade(requisicao.cidade());
        usuario.setBio(requisicao.bio());
        usuario.setFotoUrl(requisicao.fotoUrl());
        // flush: as consultas em SQL (diretório, oportunidades) leem o banco, não o contexto do JPA.
        return resposta(usuarios.saveAndFlush(usuario));
    }

    // Senha atual errada vira 400 em "senhaAtual" (não 401: o front trata 401 como sessão expirada).
    @Transactional
    public void alterarSenha(Long usuarioId, SenhaAlteracaoRequisicao requisicao) {
        Usuario usuario = buscarUsuario(usuarioId);
        conferirSenha(usuario, requisicao.senhaAtual(), "senhaAtual");
        usuario.setSenhaHash(passwordEncoder.encode(requisicao.novaSenha()));
        usuarios.save(usuario);
    }

    // Apaga o usuário; o ON DELETE CASCADE do banco leva publicações, conexões, mensagens etc.
    // A configuração sai pelo JPA para não sobrar no contexto uma entidade apontando para o usuário apagado.
    @Transactional
    public void excluirConta(Long usuarioId, ExclusaoContaRequisicao requisicao) {
        Usuario usuario = buscarUsuario(usuarioId);
        conferirSenha(usuario, requisicao.senha(), "senha");
        configuracoes.deleteById(usuario.getId());
        usuarios.delete(usuario);
        usuarios.flush();
    }

    private void conferirSenha(Usuario usuario, String senha, String campo) {
        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            throw ErroApiException.campoInvalido(campo, "senha incorreta");
        }
    }

    // Converte a entidade para a resposta da API, buscando o nome do curso quando houver.
    UsuarioResposta resposta(Usuario usuario) {
        CursoResposta curso = null;
        if (usuario.getCursoId() != null) {
            curso = jdbc.sql("SELECT id, nome FROM cursos WHERE id = ?")
                    .param(usuario.getCursoId())
                    .query((rs, i) -> new CursoResposta(rs.getLong("id"), rs.getString("nome")))
                    .optional()
                    .orElse(null);
        }
        return UsuarioResposta.de(usuario, curso);
    }

    // Token válido de um usuário que não existe mais: trata como não autenticado.
    private Usuario buscarUsuario(Long usuarioId) {
        return usuarios.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
