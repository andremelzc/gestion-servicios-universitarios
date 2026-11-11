package edu.universidad.servicios.usuario.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@UsuarioActualizarRequest.RolAreaCoherente
public class UsuarioActualizarRequest {

    @NotBlank
    @Size(min = 2, max = 50)
    @SinHtml
    private String nombre;

    @NotBlank
    @Size(min = 2, max = 50)
    @SinHtml
    private String apellido;

    @Size(max = 20)
    private String telefono;

    @NotBlank
    @Pattern(regexp = "ESTUDIANTE|TECNICO|SUPERVISOR|ADMIN")
    private String rol;

    @Positive
    private Integer idArea;

    @java.lang.annotation.Target(java.lang.annotation.ElementType.TYPE)
    @java.lang.annotation.Retention(
        java.lang.annotation.RetentionPolicy.RUNTIME
    )
    @jakarta.validation.Constraint(validatedBy = RolAreaValidator.class)
    public @interface RolAreaCoherente {
        String message() default "El área es obligatoria para TECNICO/SUPERVISOR y no se admite para ESTUDIANTE/ADMIN";

        Class<?>[] groups() default {};

        Class<? extends jakarta.validation.Payload>[] payload() default {};
    }

    public static class RolAreaValidator
        implements
            jakarta.validation.ConstraintValidator<
                RolAreaCoherente,
                UsuarioActualizarRequest
            >
    {

        @Override
        public boolean isValid(
            UsuarioActualizarRequest d,
            jakarta.validation.ConstraintValidatorContext context
        ) {
            if (
                d == null ||
                d.rol == null ||
                (d.rol.equals("TECNICO") || d.rol.equals("SUPERVISOR")) ==
                    (d.idArea != null)
            ) return true;
            context.disableDefaultConstraintViolation();
            context
                .buildConstraintViolationWithTemplate(
                    context.getDefaultConstraintMessageTemplate()
                )
                .addPropertyNode("idArea")
                .addConstraintViolation();
            return false;
        }
    }
}
