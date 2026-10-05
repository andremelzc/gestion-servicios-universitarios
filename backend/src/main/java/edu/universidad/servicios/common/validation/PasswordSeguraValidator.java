package edu.universidad.servicios.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validador para {@link PasswordSegura}.
 * Política RN-03: ≥ 8 caracteres, al menos 1 mayúscula, al menos 1 dígito.
 */
public class PasswordSeguraValidator implements ConstraintValidator<PasswordSegura, String> {

    private static final int MIN_LENGTH = 8;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        if (value.length() < MIN_LENGTH) {
            return false;
        }

        boolean tieneMayuscula = false;
        boolean tieneDigito = false;

        for (char c : value.toCharArray()) {
            if (Character.isUpperCase(c)) {
                tieneMayuscula = true;
            }
            if (Character.isDigit(c)) {
                tieneDigito = true;
            }
            if (tieneMayuscula && tieneDigito) {
                return true;
            }
        }

        return tieneMayuscula && tieneDigito;
    }
}
