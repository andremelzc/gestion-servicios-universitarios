package edu.universidad.servicios.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Rechaza cualquier cadena que contenga etiquetas HTML ({@code <...>}).
 * Se aplica a campos de texto libre (nombres, descripciones, comentarios)
 * para prevenir inyección de HTML/XSS en origen (ADR-005).
 *
 * <p>Acepta {@code null} (combinar con {@code @NotBlank} si se requiere obligatoriedad).</p>
 */
@Documented
@Constraint(validatedBy = SinHtmlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SinHtml {

    String message() default "No se permiten etiquetas HTML";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
