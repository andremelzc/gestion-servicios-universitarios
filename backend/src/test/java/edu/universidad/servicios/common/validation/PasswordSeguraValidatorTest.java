package edu.universidad.servicios.common.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordSeguraValidatorTest {

    private PasswordSeguraValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PasswordSeguraValidator();
    }

    @Test
    @DisplayName("Debe permitir nulo (responsabilidad de @NotBlank)")
    void debePermitirNulo() {
        assertTrue(validator.isValid(null, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Admin123",
            "ClaveSegura2026",
            "XyZ987654321",
            "Password1"
    })
    @DisplayName("Debe validar contraseñas que cumplen política (≥ 8 caracteres, mayúscula, dígito)")
    void debeAceptarContrasenasValidas(String password) {
        assertTrue(validator.isValid(password, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Corto1",       // Menos de 8 caracteres
            "solominusculas1", // Sin mayúscula
            "SOLOMAYUSCULAS1", // Con mayúscula y dígito (válida)
            "SoloLetrasSinDigitos", // Sin dígito
            "12345678"      // Sin mayúscula
    })
    @DisplayName("Debe rechazar contraseñas que incumplen las reglas de longitud o caracteres")
    void debeRechazarContrasenasInvalidas(String password) {
        if ("SOLOMAYUSCULAS1".equals(password)) {
            assertTrue(validator.isValid(password, null));
        } else {
            assertFalse(validator.isValid(password, null));
        }
    }
}
