package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.common.validation.SinHtml;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComentarioCrearRequest(
    @NotBlank @Size(min = 1, max = 500) @SinHtml String comentario,
    Boolean privado
) {
    public ComentarioCrearRequest {
        privado = Boolean.TRUE.equals(privado);
    }
}
