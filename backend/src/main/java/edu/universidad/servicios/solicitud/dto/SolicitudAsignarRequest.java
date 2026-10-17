package edu.universidad.servicios.solicitud.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SolicitudAsignarRequest(
        @NotNull(message = "El id del técnico es obligatorio")
        Long idTecnico,

        @Size(max = 255, message = "La nota no puede superar 255 caracteres")
        String nota
) {
}
