package edu.universidad.servicios.auth.dto;

import edu.universidad.servicios.common.validation.DominioInstitucional;
import edu.universidad.servicios.common.validation.PasswordSegura;
import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para el registro público de estudiantes (US-02, US-03).
 *
 * <p><strong>No declara campo {@code rol}</strong>: el servidor fuerza
 * {@code ROLE_ESTUDIANTE} (RN-04). Si Jackson recibe un campo desconocido
 * como {@code "rol"}, el controlador lo rechazará con 400 (CA-6).</p>
 */
@Data
public class RegistroRequest {

    @NotBlank(message = "El código institucional es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9]{6,20}$",
             message = "El código institucional debe tener entre 6 y 20 caracteres alfanuméricos")
    private String codigoInstitucional;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    @SinHtml
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    @SinHtml
    private String apellido;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Debe ser un correo electrónico válido")
    @DominioInstitucional
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @PasswordSegura
    private String password;
}
