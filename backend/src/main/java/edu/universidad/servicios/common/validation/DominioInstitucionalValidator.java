package edu.universidad.servicios.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Value;

/**
 * Validador para {@link DominioInstitucional}.
 * Comprueba que la parte del dominio del correo coincida con el valor
 * configurado en {@code app.security.allowed-email-domain} (RN-02).
 *
 * <p>El dominio permitido es configurable por entorno a través de la variable
 * {@code ALLOWED_EMAIL_DOMAIN} (por defecto {@code universidad.edu}).</p>
 */
public class DominioInstitucionalValidator implements ConstraintValidator<DominioInstitucional, String> {

    @Value("${app.security.allowed-email-domain:universidad.edu}")
    private String allowedDomain;

    @Override
    public void initialize(DominioInstitucional constraintAnnotation) {
        // No se necesita inicialización adicional
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String correoNormalizado = value.trim().toLowerCase();
        int arrobaIndex = correoNormalizado.lastIndexOf('@');

        if (arrobaIndex < 0) {
            // No tiene @, dejamos que @Email se encargue de esto
            return true;
        }

        String dominio = correoNormalizado.substring(arrobaIndex + 1);

        if (!dominio.equals(allowedDomain.toLowerCase())) {
            // Personalizar el mensaje con el dominio configurado
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    "Debe usar correo institucional (@" + allowedDomain + ")"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }
}
