package edu.universidad.servicios.common.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DominioInstitucionalValidatorTest {

    private DominioInstitucionalValidator validator;
    private ConstraintValidatorContext context;
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    @BeforeEach
    void setUp() {
        validator = new DominioInstitucionalValidator();
        ReflectionTestUtils.setField(validator, "allowedDomain", "universidad.edu");

        context = mock(ConstraintValidatorContext.class);
        violationBuilder = mock(ConstraintValidatorContext.ConstraintViolationBuilder.class);
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
    }

    @Test
    @DisplayName("Debe permitir correo nulo (delegado a @NotBlank)")
    void debePermitirNulo() {
        assertTrue(validator.isValid(null, context));
    }

    @Test
    @DisplayName("Debe permitir correos sin @ (delegado a @Email)")
    void debePermitirSinArroba() {
        assertTrue(validator.isValid("correosinformatocorrecto", context));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "estudiante@universidad.edu",
            "ADMIN@UNIVERSIDAD.EDU",
            "  profesor@universidad.edu  "
    })
    @DisplayName("Debe aceptar correos con el dominio institucional configurado")
    void debeAceptarDominioInstitucional(String correo) {
        assertTrue(validator.isValid(correo, context));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "estudiante@gmail.com",
            "usuario@otro.edu",
            "hacker@universidad.edu.pe"
    })
    @DisplayName("Debe rechazar correos con dominios ajenos")
    void debeRechazarDominioAjeno(String correo) {
        assertFalse(validator.isValid(correo, context));
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate(contains("universidad.edu"));
    }
}
