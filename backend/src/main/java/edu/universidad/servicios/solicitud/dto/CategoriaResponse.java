package edu.universidad.servicios.solicitud.dto;

public record CategoriaResponse(
        Integer id,
        String nombre,
        String descripcion,
        Integer areaId,
        String areaNombre,
        Integer tiempoSlaHoras
) {
}
