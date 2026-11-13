package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudResolverRequest(
        @NotBlank(message = "El informe de resolución es obligatorio")
        @Size(min = 20, max = 2000, message = "El informe de resolución debe contener al menos 20 caracteres")
        @SinHtml(message = "El informe de resolución no puede contener etiquetas HTML")
        String informe
) {
}
