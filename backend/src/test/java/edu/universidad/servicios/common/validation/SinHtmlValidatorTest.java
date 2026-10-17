package edu.universidad.servicios.common.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SinHtmlValidatorTest {

    private SinHtmlValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SinHtmlValidator();
    }

    @Test
    @DisplayName("Debe permitir valor nulo (delegado a @NotBlank)")
    void debePermitirNulo() {
        assertTrue(validator.isValid(null, null));
    }

    @Test
    @DisplayName("Debe permitir texto plano regular")
    void debePermitirTextoPlano() {
        assertTrue(validator.isValid("Texto limpio sin etiquetas", null));
        assertTrue(validator.isValid("Solicitud de mantenimiento 123.", null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert(1)</script>",
            "Texto con <b>negrita</b>",
            "<img src='x' onerror='alert(1)'/>",
            "<div>contenido</div>",
            "<a href='http://malicious.com'>link</a>",
            "Cierre de tag </p>"
    })
    @DisplayName("Debe rechazar cadenas que contienen etiquetas HTML")
    void debeRechazarEtiquetasHtml(String payload) {
        assertFalse(validator.isValid(payload, null));
    }
}
