package edu.universidad.servicios.usuario.dto;

import edu.universidad.servicios.common.validation.DominioInstitucional;
import edu.universidad.servicios.common.validation.PasswordSegura;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UsuarioCrearRequest extends UsuarioActualizarRequest {
    @NotBlank @Pattern(regexp = "[A-Za-z0-9]{6,20}")
    private String codigoInstitucional;
    @NotBlank @Email @Size(max = 100) @DominioInstitucional
    private String correo;
    @NotBlank @PasswordSegura @Size(max = 72)
    private String password;
}
