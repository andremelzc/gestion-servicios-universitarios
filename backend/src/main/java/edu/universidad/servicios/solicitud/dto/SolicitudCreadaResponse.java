package edu.universidad.servicios.solicitud.dto;

import java.time.LocalDateTime;

public record SolicitudCreadaResponse(
        Long id,
        String codigo,
        String titulo,
        String estado,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaLimiteSla,
        String mensaje
) {
    public SolicitudCreadaResponse(
            Long id,
            String codigo,
            String titulo,
            String estado,
            LocalDateTime fechaRegistro,
            LocalDateTime fechaLimiteSla
    ) {
        this(id, codigo, titulo, estado, fechaRegistro, fechaLimiteSla, "Solicitud registrada con éxito");
    }
}
