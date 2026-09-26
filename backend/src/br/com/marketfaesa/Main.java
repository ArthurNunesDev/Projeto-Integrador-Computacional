package br.com.marketfaesa;

import br.com.marketfaesa.model.Usuario;

public class Main {
    public static void main(String[] args) {
        System.out.println("MarketFaesa backend iniciado.");
        Usuario u = new Usuario(1, "joao", "João Silva", "joao@faesa.br");
        System.out.println(u);
    }
}
