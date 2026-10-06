package br.com.marketfaesa;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class MarketFaesaApplicationTests {

    @Autowired
    DataSource dataSource;

    @Test
    void contextLoads() {
    }

    @Test
    void usaPostgresDeTeste() throws Exception {
        try (Connection conexao = dataSource.getConnection()) {
            assertThat(conexao.getMetaData().getDatabaseProductName()).isEqualTo("PostgreSQL");
        }
    }

}
