package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.ConfiguracaoDto;
import br.com.marketfaesa.dto.CursoResposta;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.error.UsuarioNaoEncontradoException;
import br.com.marketfaesa.model.ConfiguracaoUsuario;
import br.com.marketfaesa.model.Usuario;
import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import br.com.marketfaesa.repository.UsuarioRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Dados do usuário logado (/api/usuarios/me) e suas configurações.
@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final ConfiguracaoUsuarioRepository configuracoes;
    private final JdbcClient jdbc;

    public UsuarioService(UsuarioRepository usuarios, ConfiguracaoUsuarioRepository configuracoes, JdbcClient jdbc) {
        this.usuarios = usuarios;
        this.configuracoes = configuracoes;
        this.jdbc = jdbc;
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
