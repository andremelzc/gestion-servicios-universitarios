package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.HistorialSolicitud;

import java.time.LocalDateTime;

public record HistorialItemResponse(
        LocalDateTime fecha,
        String usuario,
        String estadoAnterior,
        String estadoNuevo,
        String nota
) {
    public static HistorialItemResponse de(HistorialSolicitud h) {
        String nombreUsuario = (h.getUsuario() != null)
                ? (h.getUsuario().getNombre() + " " + h.getUsuario().getApellido()).trim()
                : "Sistema";
        String estadoAnt = (h.getEstadoAnterior() != null) ? h.getEstadoAnterior().getCodigo() : null;
        String estadoPost = (h.getEstadoNuevo() != null) ? h.getEstadoNuevo().getCodigo() : null;

        return new HistorialItemResponse(
                h.getFechaCambio(),
                nombreUsuario,
                estadoAnt,
                estadoPost,
                h.getNota()
        );
    }
}
