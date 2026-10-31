package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SolicitudAsignarRequest(
        @NotNull(message = "El id del técnico es obligatorio")
        Long idTecnico,

        @Size(max = 255, message = "La nota no puede superar 255 caracteres")
        @SinHtml(message = "La nota de asignación no puede contener etiquetas HTML")
        String nota
) {
}
