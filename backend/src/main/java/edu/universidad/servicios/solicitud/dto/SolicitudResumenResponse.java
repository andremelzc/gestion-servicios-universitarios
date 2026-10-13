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
    public static SolicitudResumenResponse de(edu.universidad.servicios.solicitud.domain.Solicitud s) {
        String tecnico = (s.getTecnicoAsignado() != null)
                ? (s.getTecnicoAsignado().getNombre() + " " + s.getTecnicoAsignado().getApellido()).trim()
                : null;
        return new SolicitudResumenResponse(
                s.getId(),
                s.getCodigo(),
                s.getTitulo(),
                s.getCategoria() != null ? s.getCategoria().getNombre() : null,
                s.getPrioridad() != null ? s.getPrioridad().getNivel() : null,
                s.getEstado() != null ? s.getEstado().getCodigo() : null,
                s.getEstado() != null ? s.getEstado().getNombreVisible() : null,
                s.getEstado() != null ? s.getEstado().getColorHex() : null,
                tecnico,
                s.getFechaRegistro(),
                s.getFechaLimiteSla()
        );
    }
}
