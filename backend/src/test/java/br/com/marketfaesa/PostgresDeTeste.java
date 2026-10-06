package br.com.marketfaesa;

import java.io.IOException;
import java.io.UncheckedIOException;

import javax.sql.DataSource;

import org.springframework.boot.flyway.autoconfigure.FlywayDataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * Banco PostgreSQL dos testes.
 *
 * <p>Se a variavel de ambiente {@code TEST_DATABASE_URL} existir (com
 * {@code TEST_DATABASE_USERNAME} e {@code TEST_DATABASE_PASSWORD} opcionais),
 * os testes usam esse banco. Senao, sobe um PostgreSQL embutido (zonky), sem
 * Docker. O mesmo DataSource e usado pelo Flyway, entao as migrations rodam
 * antes dos testes.
 *
 * <p>Por ser um {@code @Configuration} no pacote {@code br.com.marketfaesa}, e
 * encontrado pelo component scan e vale automaticamente para todo
 * {@code @SpringBootTest}. Testes de fatia (ex.: {@code @DataJpaTest}) nao fazem
 * component scan: neles use {@code @Import(PostgresDeTeste.class)} e
 * {@code @AutoConfigureTestDatabase(replace = Replace.NONE)}.
 */
@Configuration(proxyBeanMethods = false)
public class PostgresDeTeste {

    private static EmbeddedPostgres embutido;

    @Bean
    @Primary
    @FlywayDataSource
    DataSource dataSource() {
        String url = System.getenv("TEST_DATABASE_URL");
        if (url != null && !url.isBlank()) {
            return DataSourceBuilder.create()
                    .url(url)
                    .username(System.getenv("TEST_DATABASE_USERNAME"))
                    .password(System.getenv("TEST_DATABASE_PASSWORD"))
                    .build();
        }
        return postgresEmbutido().getPostgresDatabase();
    }

    /** Um unico Postgres embutido por JVM, compartilhado entre os contextos de teste. */
    private static synchronized EmbeddedPostgres postgresEmbutido() {
        if (embutido == null) {
            try {
                embutido = EmbeddedPostgres.builder().start();
            } catch (IOException e) {
                throw new UncheckedIOException("Nao foi possivel subir o PostgreSQL embutido. "
                        + "Defina TEST_DATABASE_URL para usar um PostgreSQL ja instalado.", e);
            }
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    embutido.close();
                } catch (IOException ignorada) {
                    // a JVM ja esta encerrando
                }
            }));
        }
        return embutido;
    }
}
