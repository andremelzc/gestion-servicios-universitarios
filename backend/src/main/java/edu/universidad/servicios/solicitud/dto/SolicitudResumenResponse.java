package edu.universidad.servicios.solicitud.dto;

import java.time.LocalDateTime;

public record SolicitudResumenResponse(
        Long id,
        String codigo,
        String titulo,
        String categoriaNombre,
        String prioridadNivel,
        String estadoCodigo,
        String estadoNombre,
        String estadoColorHex,
        String tecnicoNombreCompleto,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaLimiteSla
) {
}
