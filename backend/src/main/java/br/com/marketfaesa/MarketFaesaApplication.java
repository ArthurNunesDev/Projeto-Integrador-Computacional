package br.com.marketfaesa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
// Limpeza periódica das notificações antigas (NotificacaoService).
@EnableScheduling
public class MarketFaesaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketFaesaApplication.class, args);
    }

}
