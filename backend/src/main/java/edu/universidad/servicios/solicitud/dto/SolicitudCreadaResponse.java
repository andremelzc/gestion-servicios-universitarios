package edu.universidad.servicios.solicitud.dto;

import java.time.LocalDateTime;

public record SolicitudCreadaResponse(
        Long id,
        String codigo,
        String titulo,
        String estado,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaLimiteSla
) {
}
