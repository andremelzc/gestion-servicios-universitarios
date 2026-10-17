package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.Categoria;

public record CategoriaResponse(
        Integer id,
        String nombre,
        String descripcion,
        Integer idArea,
        String area,
        Integer tiempoSlaHoras,
        Boolean activo
) {
    public static CategoriaResponse de(Categoria c) {
        return new CategoriaResponse(
                c.getId(),
                c.getNombre(),
                c.getDescripcion(),
                c.getArea() != null ? c.getArea().getId() : null,
                c.getArea() != null ? c.getArea().getNombre() : null,
                c.getTiempoSlaHoras(),
                c.getActivo()
        );
    }
}
