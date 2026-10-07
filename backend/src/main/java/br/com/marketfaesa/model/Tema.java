package br.com.marketfaesa.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

// Tema da interface. No banco é guardado em minúsculo ('light' / 'dark').
public enum Tema {
    LIGHT("light"),
    DARK("dark");

    private final String valor;

    Tema(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    public static Tema deValor(String valor) {
        for (Tema tema : values()) {
            if (tema.valor.equalsIgnoreCase(valor)) {
                return tema;
            }
        }
        throw new IllegalArgumentException("Tema desconhecido: " + valor);
    }

    @Converter(autoApply = true)
    public static class TemaConverter implements AttributeConverter<Tema, String> {

        @Override
        public String convertToDatabaseColumn(Tema tema) {
            return tema == null ? null : tema.valor;
        }

        @Override
        public Tema convertToEntityAttribute(String valor) {
            return valor == null ? null : deValor(valor);
        }
    }
}
