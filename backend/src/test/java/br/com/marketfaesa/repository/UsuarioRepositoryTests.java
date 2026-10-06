package br.com.marketfaesa.repository;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.marketfaesa.model.ConfiguracaoUsuario;
import br.com.marketfaesa.model.Tema;
import br.com.marketfaesa.model.Usuario;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

// O banco vem de PostgresDeTeste (encontrado pelo component scan).
@SpringBootTest
@Transactional
class UsuarioRepositoryTests {

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private ConfiguracaoUsuarioRepository configuracoes;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void gravaUsuarioEConfiguracaoComPadroes() {
        Usuario usuario = usuarios.save(new Usuario("Ana Souza", "  Ana.Souza@FAESA.br ", "$2a$10$hash"));
        configuracoes.save(new ConfiguracaoUsuario(usuario));
        entityManager.flush();
        entityManager.clear();

        Usuario lido = usuarios.findById(usuario.getId()).orElseThrow();
        assertThat(lido.getEmail()).isEqualTo("ana.souza@faesa.br");
        assertThat(lido.getNome()).isEqualTo("Ana Souza");
        assertThat(lido.getSenhaHash()).isEqualTo("$2a$10$hash");
        assertThat(lido.getCursoId()).isNull();
        assertThat(lido.getCriadoEm()).isNotNull();
        assertThat(lido.getAtualizadoEm()).isNotNull();

        ConfiguracaoUsuario config = configuracoes.findById(usuario.getId()).orElseThrow();
        assertThat(config.getUsuarioId()).isEqualTo(usuario.getId());
        assertThat(config.getUsuario().getId()).isEqualTo(usuario.getId());
        assertThat(config.getTema()).isEqualTo(Tema.LIGHT);
        assertThat(config.isPerfilPublico()).isTrue();
        assertThat(config.isMostrarEmail()).isFalse();
        assertThat(config.isPermitirMensagens()).isTrue();
        assertThat(config.isNovasOportunidades()).isTrue();
        assertThat(config.isMensagens()).isTrue();
        assertThat(config.isConexoes()).isTrue();
        assertThat(config.isPublicacoes()).isTrue();
        assertThat(config.isResumoSemanal()).isFalse();
        assertThat(config.isReduzirAnimacoes()).isFalse();
    }

    @Test
    void temaEhGravadoEmMinusculo() {
        Usuario usuario = usuarios.save(new Usuario("Bruno", "bruno@faesa.br", "hash"));
        ConfiguracaoUsuario config = new ConfiguracaoUsuario(usuario);
        config.setTema(Tema.DARK);
        configuracoes.save(config);
        entityManager.flush();
        entityManager.clear();

        String tema = jdbc.queryForObject(
                "SELECT tema FROM configuracoes_usuario WHERE usuario_id = ?", String.class, usuario.getId());
        assertThat(tema).isEqualTo("dark");
        assertThat(configuracoes.findById(usuario.getId()).orElseThrow().getTema()).isEqualTo(Tema.DARK);
    }

    @Test
    void buscaPorEmail() {
        usuarios.save(new Usuario("Carla", "CARLA@faesa.br", "hash"));
        entityManager.flush();
        entityManager.clear();

        String email = jdbc.queryForObject("SELECT email FROM usuarios WHERE nome = 'Carla'", String.class);
        assertThat(email).isEqualTo("carla@faesa.br");

        assertThat(usuarios.findByEmail("carla@faesa.br")).get()
                .extracting(Usuario::getNome).isEqualTo("Carla");
        assertThat(usuarios.findByEmail(Usuario.normalizarEmail("Carla@FAESA.br"))).isPresent();
        assertThat(usuarios.existsByEmail("carla@faesa.br")).isTrue();
        assertThat(usuarios.existsByEmail("outra@faesa.br")).isFalse();
        assertThat(usuarios.findByEmail("outra@faesa.br")).isEmpty();
    }
}
