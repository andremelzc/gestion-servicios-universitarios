package edu.universidad.servicios.solicitud.dto;

import java.time.Clock;
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
        LocalDateTime fechaLimiteSla,
        Boolean vencida
) {
    public SolicitudResumenResponse(
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
        this(
                id,
                codigo,
                titulo,
                categoriaNombre,
                prioridadNivel,
                estadoCodigo,
                estadoNombre,
                estadoColorHex,
                tecnicoNombreCompleto,
                fechaRegistro,
                fechaLimiteSla,
                calcularVencida(estadoCodigo, fechaLimiteSla, LocalDateTime.now())
        );
    }

    public static SolicitudResumenResponse de(edu.universidad.servicios.solicitud.domain.Solicitud s) {
        return de(s, Clock.systemDefaultZone());
    }

    public static SolicitudResumenResponse de(edu.universidad.servicios.solicitud.domain.Solicitud s, Clock clock) {
        String tecnico = (s.getTecnicoAsignado() != null)
                ? (s.getTecnicoAsignado().getNombre() + " " + s.getTecnicoAsignado().getApellido()).trim()
                : null;
        LocalDateTime now = LocalDateTime.now(clock != null ? clock : Clock.systemDefaultZone());
        boolean esFinal = s.getEstado() != null && Boolean.TRUE.equals(s.getEstado().getEsFinal());
        boolean vencida = !esFinal && s.getFechaLimiteSla() != null && s.getFechaLimiteSla().isBefore(now);

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
                s.getFechaLimiteSla(),
                vencida
        );
    }

    private static Boolean calcularVencida(String estadoCodigo, LocalDateTime fechaLimiteSla, LocalDateTime now) {
        if (fechaLimiteSla == null) {
            return false;
        }
        boolean finalizado = "RESUELTA".equalsIgnoreCase(estadoCodigo) || "CERRADA".equalsIgnoreCase(estadoCodigo);
        return !finalizado && fechaLimiteSla.isBefore(now);
    }
}
