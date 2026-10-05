package edu.universidad.servicios.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida que el correo pertenezca al dominio institucional configurado
 * en {@code app.security.allowed-email-domain} (RN-02).
 *
 * <p>Acepta {@code null} (combinar con {@code @NotBlank} y {@code @Email} para validación completa).</p>
 */
@Documented
@Constraint(validatedBy = DominioInstitucionalValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface DominioInstitucional {

    String message() default "Debe usar correo institucional";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
