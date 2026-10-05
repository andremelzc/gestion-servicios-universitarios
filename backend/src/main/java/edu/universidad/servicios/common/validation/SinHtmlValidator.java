package edu.universidad.servicios.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validador para {@link SinHtml}.
 * Rechaza cualquier cadena que contenga patrones de etiquetas HTML:
 * {@code <tag>}, {@code </tag>}, {@code <tag/>}, {@code <tag attr="...">}.
 */
public class SinHtmlValidator implements ConstraintValidator<SinHtml, String> {

    /**
     * Patrón que detecta etiquetas HTML abiertas o cerradas.
     * Ejemplos que captura: {@code <script>}, {@code </div>}, {@code <img src="x"/>}, {@code <br/>}.
     */
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]+>");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null se considera válido; usar @NotBlank para obligatoriedad
        if (value == null) {
            return true;
        }
        return !HTML_TAG_PATTERN.matcher(value).find();
    }
}
