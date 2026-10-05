package edu.universidad.servicios.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida que la contraseña cumpla la política de seguridad RN-03:
 * <ul>
 *   <li>Mínimo 8 caracteres</li>
 *   <li>Al menos 1 letra mayúscula</li>
 *   <li>Al menos 1 dígito</li>
 * </ul>
 *
 * <p>Acepta {@code null} (combinar con {@code @NotBlank} si se requiere obligatoriedad).</p>
 */
@Documented
@Constraint(validatedBy = PasswordSeguraValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordSegura {

    String message() default "La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
