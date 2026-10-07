package br.com.marketfaesa.dto.validacao;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Limita o tamanho do texto em bytes UTF-8. O BCrypt so aceita senhas de ate 72
 * bytes, e um acento ocupa 2 bytes, entao {@code @Size(max = 72)} nao basta.
 */
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MaximoBytes.Validador.class)
public @interface MaximoBytes {

    int value();

    String message() default "deve ter no máximo {value} bytes";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validador implements ConstraintValidator<MaximoBytes, String> {

        private int maximo;

        @Override
        public void initialize(MaximoBytes anotacao) {
            maximo = anotacao.value();
        }

        @Override
        public boolean isValid(String valor, ConstraintValidatorContext contexto) {
            return valor == null || valor.getBytes(StandardCharsets.UTF_8).length <= maximo;
        }
    }
}
