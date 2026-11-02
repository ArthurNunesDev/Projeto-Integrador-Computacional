package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.CadastroRequisicao;
import br.com.marketfaesa.dto.LoginRequisicao;
import br.com.marketfaesa.dto.LoginResposta;
import br.com.marketfaesa.dto.UsuarioResposta;
import br.com.marketfaesa.error.CredenciaisInvalidasException;
import br.com.marketfaesa.error.EmailJaCadastradoException;
import br.com.marketfaesa.model.ConfiguracaoUsuario;
import br.com.marketfaesa.model.Usuario;
import br.com.marketfaesa.repository.ConfiguracaoUsuarioRepository;
import br.com.marketfaesa.repository.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Cadastro e login. O login não passa pelo AuthenticationManager: compara a senha com o PasswordEncoder.
@Service
public class AuthService {

    private static final int LIMITE_BCRYPT_BYTES = 72;

    private final UsuarioRepository usuarios;
    private final ConfiguracaoUsuarioRepository configuracoes;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final UsuarioService usuarioService;
    private final LimiteTentativas limiteLogin;
    private final LimiteTentativas limiteCadastro;
    // Hash de uma senha qualquer, comparado quando o e-mail não existe para o tempo de resposta
    // não revelar se o e-mail está cadastrado.
    private final String hashFicticio;

    public AuthService(UsuarioRepository usuarios, ConfiguracaoUsuarioRepository configuracoes,
            PasswordEncoder passwordEncoder, TokenService tokenService, UsuarioService usuarioService,
            LimiteTentativas limiteLogin, LimiteTentativas limiteCadastro) {
        this.usuarios = usuarios;
        this.configuracoes = configuracoes;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.usuarioService = usuarioService;
        this.limiteLogin = limiteLogin;
        this.limiteCadastro = limiteCadastro;
        this.hashFicticio = passwordEncoder.encode("senha-ficticia-para-tempo-constante");
    }

    // Cria o usuário e a configuração padrão na mesma transação. Limite por IP: toda tentativa conta,
    // inclusive o 409, para o cadastro não servir para descobrir quais e-mails existem.
    @Transactional
    public UsuarioResposta cadastrar(CadastroRequisicao requisicao, String ip) {
        limiteCadastro.consumir(ip);
        String email = Usuario.normalizarEmail(requisicao.email());
        if (usuarios.existsByEmail(email)) {
            throw new EmailJaCadastradoException();
        }
        Usuario usuario = new Usuario(requisicao.nome(), email, passwordEncoder.encode(requisicao.senha()));
        try {
            usuario = usuarios.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException e) {
            // Dois cadastros simultâneos com o mesmo e-mail: o UNIQUE do banco barra o segundo.
            throw new EmailJaCadastradoException();
        }
        configuracoes.save(new ConfiguracaoUsuario(usuario));
        return usuarioService.resposta(usuario);
    }

    // E-mail inexistente e senha errada dão o mesmo erro. Limite por IP e e-mail, para ninguém bloquear a conta
    // de outra pessoa só por conhecer o e-mail; o login certo zera a contagem do par.
    @Transactional(readOnly = true)
    public LoginResposta login(LoginRequisicao requisicao, String ip) {
        String email = Usuario.normalizarEmail(requisicao.email());
        String chaveLimite = ip + "|" + email;
        limiteLogin.consumir(chaveLimite);
        // O BCrypt recusa senhas acima de 72 bytes; nenhuma senha cadastrada passa disso.
        if (requisicao.senha().getBytes(StandardCharsets.UTF_8).length > LIMITE_BCRYPT_BYTES) {
            throw new CredenciaisInvalidasException();
        }
        Usuario usuario = usuarios.findByEmail(email).orElse(null);
        if (usuario == null) {
            passwordEncoder.matches(requisicao.senha(), hashFicticio);
            throw new CredenciaisInvalidasException();
        }
        if (!passwordEncoder.matches(requisicao.senha(), usuario.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }
        LoginResposta resposta = new LoginResposta(tokenService.gerar(usuario), usuarioService.resposta(usuario));
        limiteLogin.liberar(chaveLimite);
        return resposta;
    }
}
