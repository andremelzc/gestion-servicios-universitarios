package edu.universidad.servicios.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import edu.universidad.servicios.common.validation.PasswordSegura;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO para la petición de cambio de contraseña por usuario autenticado (US-18 / AUTH-12).
 */
public record CambiarPasswordRequest(
        @NotBlank(message = "La contraseña actual es obligatoria")
        String passwordActual,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @PasswordSegura
        @JsonAlias({"passwordNueva", "nuevaPassword"})
        String nuevaPassword
) {
}
