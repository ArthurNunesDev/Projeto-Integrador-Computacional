package br.com.marketfaesa.repository;

import br.com.marketfaesa.model.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // O e-mail é gravado em minúsculo; normalize antes de consultar (Usuario.normalizarEmail).
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
