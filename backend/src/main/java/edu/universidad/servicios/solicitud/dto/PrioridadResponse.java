package edu.universidad.servicios.solicitud.dto;

public record PrioridadResponse(
        Integer id,
        String nivel,
        Integer ponderador,
        Integer slaMaxHoras
) {
}
