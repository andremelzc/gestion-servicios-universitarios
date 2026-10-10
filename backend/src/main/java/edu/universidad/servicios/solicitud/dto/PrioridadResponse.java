package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.Prioridad;

public record PrioridadResponse(
        Integer id,
        String nivel,
        Integer ponderador,
        Integer slaMaxHoras,
        Boolean activo
) {
    public static PrioridadResponse de(Prioridad p) {
        return new PrioridadResponse(
                p.getId(),
                p.getNivel(),
                p.getPonderador(),
                p.getSlaMaxHoras(),
                p.getActivo()
        );
    }
}
