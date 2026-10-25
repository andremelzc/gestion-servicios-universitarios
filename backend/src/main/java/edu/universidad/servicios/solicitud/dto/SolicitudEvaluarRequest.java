package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Datos para la evaluación de una solicitud (GES-11 / US-23 / CA-6)")
public record SolicitudEvaluarRequest(
        @Schema(description = "Identificador de la nueva prioridad asignada (opcional)", example = "3")
        @Positive(message = "El id de prioridad debe ser positivo")
        Integer idPrioridad,

        @Schema(description = "Nota u observación de pertinencia técnica (opcional)", example = "Prioridad ajustada debido al impacto en horario lectivo")
        @Size(max = 255, message = "La nota de evaluación no puede superar los 255 caracteres")
        @SinHtml(message = "La nota de evaluación no puede contener etiquetas HTML")
        String nota
) {
}
