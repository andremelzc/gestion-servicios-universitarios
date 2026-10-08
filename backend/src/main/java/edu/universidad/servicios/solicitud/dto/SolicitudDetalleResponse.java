package edu.universidad.servicios.solicitud.dto;

import java.time.LocalDateTime;

public record SolicitudDetalleResponse(
        Long id,
        String codigo,
        String titulo,
        String descripcion,
        String ubicacionCampus,
        String ubicacionAmbiente,
        Integer categoriaId,
        String categoriaNombre,
        Integer prioridadId,
        String prioridadNivel,
        String estadoCodigo,
        String estadoNombre,
        String estadoColorHex,
        Long solicitanteId,
        String solicitanteNombreCompleto,
        Long tecnicoId,
        String tecnicoNombreCompleto,
        String informeResolucion,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaLimiteSla,
        LocalDateTime fechaAsignacion,
        LocalDateTime fechaInicioAtencion,
        LocalDateTime fechaResolucion,
        LocalDateTime fechaCierre
) {
}
