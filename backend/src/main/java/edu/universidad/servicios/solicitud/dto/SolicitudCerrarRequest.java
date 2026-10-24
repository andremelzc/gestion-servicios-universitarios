package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Datos para el cierre formal de una solicitud (GES-13 / US-25 / CA-14)")
public record SolicitudCerrarRequest(
        @Schema(description = "Nota u observación de cierre y conformidad (opcional)", example = "Conforme con la solución brindada.")
        @Size(max = 255, message = "La nota de cierre no puede superar los 255 caracteres")
        @SinHtml(message = "La nota de cierre no puede contener etiquetas HTML")
        String nota
) {
}
