package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.EvidenciaArchivo;
import edu.universidad.servicios.solicitud.domain.Solicitud;

import java.time.LocalDateTime;
import java.util.List;

public record SolicitudDetalleResponse(
        Long id,
        String codigo,
        String titulo,
        String descripcion,
        String ubicacionCampus,
        String ubicacionAmbiente,
        Integer categoriaId,
        String categoriaNombre,
        Integer areaId,
        String areaNombre,
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
        LocalDateTime fechaCierre,
        List<EvidenciaItemResponse> evidencias,
        List<String> accionesPermitidas
) {
    public static SolicitudDetalleResponse de(
            Solicitud s,
            List<EvidenciaArchivo> evidencias,
            List<String> accionesPermitidas
    ) {
        String solicitanteNombre = (s.getSolicitante() != null)
                ? (s.getSolicitante().getNombre() + " " + s.getSolicitante().getApellido()).trim()
                : null;
        String tecnicoNombre = (s.getTecnicoAsignado() != null)
                ? (s.getTecnicoAsignado().getNombre() + " " + s.getTecnicoAsignado().getApellido()).trim()
                : null;

        List<EvidenciaItemResponse> evidenciasDto = (evidencias == null)
                ? List.of()
                : evidencias.stream().map(EvidenciaItemResponse::de).toList();

        List<String> acciones = (accionesPermitidas == null) ? List.of() : accionesPermitidas;

        return new SolicitudDetalleResponse(
                s.getId(),
                s.getCodigo(),
                s.getTitulo(),
                s.getDescripcion(),
                s.getUbicacionCampus(),
                s.getUbicacionAmbiente(),
                s.getCategoria() != null ? s.getCategoria().getId() : null,
                s.getCategoria() != null ? s.getCategoria().getNombre() : null,
                s.getCategoria() != null && s.getCategoria().getArea() != null ? s.getCategoria().getArea().getId() : null,
                s.getCategoria() != null && s.getCategoria().getArea() != null ? s.getCategoria().getArea().getNombre() : null,
                s.getPrioridad() != null ? s.getPrioridad().getId() : null,
                s.getPrioridad() != null ? s.getPrioridad().getNivel() : null,
                s.getEstado() != null ? s.getEstado().getCodigo() : null,
                s.getEstado() != null ? s.getEstado().getNombreVisible() : null,
                s.getEstado() != null ? s.getEstado().getColorHex() : null,
                s.getSolicitante() != null ? s.getSolicitante().getId() : null,
                solicitanteNombre,
                s.getTecnicoAsignado() != null ? s.getTecnicoAsignado().getId() : null,
                tecnicoNombre,
                s.getInformeResolucion(),
                s.getFechaRegistro(),
                s.getFechaLimiteSla(),
                s.getFechaAsignacion(),
                s.getFechaInicioAtencion(),
                s.getFechaResolucion(),
                s.getFechaCierre(),
                evidenciasDto,
                acciones
        );
    }
}
