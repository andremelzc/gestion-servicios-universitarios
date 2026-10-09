package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SolicitudCrearRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres")
        @SinHtml(message = "El título no puede contener etiquetas HTML")
        String titulo,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(min = 10, max = 2000, message = "La descripción debe tener entre 10 y 2000 caracteres")
        @SinHtml(message = "La descripción no puede contener etiquetas HTML")
        String descripcion,

        @NotBlank(message = "La ubicación del campus es obligatoria")
        @Size(max = 100, message = "El campus no puede superar los 100 caracteres")
        @SinHtml(message = "El campus no puede contener etiquetas HTML")
        String ubicacionCampus,

        @NotBlank(message = "La ubicación del ambiente es obligatoria")
        @Size(max = 100, message = "El ambiente no puede superar los 100 caracteres")
        @SinHtml(message = "El ambiente no puede contener etiquetas HTML")
        String ubicacionAmbiente,

        @NotNull(message = "La categoría es obligatoria")
        Integer idCategoria,

        @NotNull(message = "La prioridad es obligatoria")
        Integer idPrioridad
) {
}
