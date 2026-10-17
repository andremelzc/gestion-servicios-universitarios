package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

/**
 * Calculador de SLA según regla de negocio RN-09:
 * El límite de atención se calcula como {@code fechaRegistro + MIN(categoria.tiempoSlaHoras, prioridad.slaMaxHoras)}.
 *
 * <p>Función pura que utiliza {@link Clock} inyectable para facilitar pruebas unitarias deterministas.</p>
 */
@Component
public class SlaCalculator {

    private final Clock clock;

    public SlaCalculator(Clock clock) {
        this.clock = clock;
    }

    public LocalDateTime calcularFechaLimite(LocalDateTime fechaRegistro, Prioridad prioridad, Categoria categoria) {
        if (prioridad == null || categoria == null) {
            throw new IllegalArgumentException("La prioridad y la categoría son obligatorias para calcular el SLA");
        }

        LocalDateTime base = (fechaRegistro != null) ? fechaRegistro : LocalDateTime.now(clock);

        int horasCategoria = categoria.getTiempoSlaHoras() != null ? categoria.getTiempoSlaHoras() : 48;
        int horasPrioridad = prioridad.getSlaMaxHoras() != null ? prioridad.getSlaMaxHoras() : 48;

        int horasEfectivas = Math.min(horasCategoria, horasPrioridad);

        return base.plusHours(horasEfectivas);
    }
}
