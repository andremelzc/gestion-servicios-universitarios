package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Solicitud;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Set;

@Component
public class SolicitudMetrics {
    private static final Set<String> PRIORIDADES = Set.of("BAJA", "MEDIA", "ALTA", "CRITICA");
    private static final Set<String> AREAS = Set.of("Tecnologías de la Información",
            "Mantenimiento e Infraestructura", "Servicios Generales");
    private static final Set<String> ESTADOS = Set.of("REGISTRADA", "EN_EVALUACION", "ASIGNADA",
            "EN_ATENCION", "RESUELTA", "CERRADA");

    private final MeterRegistry registry;

    public SolicitudMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void creada(Solicitud solicitud) {
        String prioridad = solicitud.getPrioridad() == null ? null : solicitud.getPrioridad().getNivel();
        String area = solicitud.getCategoria() == null || solicitud.getCategoria().getArea() == null
                ? null : solicitud.getCategoria().getArea().getNombre();
        String prioridadTag = limitar(prioridad, PRIORIDADES);
        String areaTag = limitar(area, AREAS);
        afterCommit(() -> registry.counter("solicitudes_creadas", "prioridad", prioridadTag, "area", areaTag).increment());
    }

    public void transicion(String desde, String hacia) {
        String desdeTag = limitar(desde, ESTADOS);
        String haciaTag = limitar(hacia, ESTADOS);
        afterCommit(() -> registry.counter("solicitudes_transiciones", "desde", desdeTag, "hacia", haciaTag).increment());
    }

    private static String limitar(String valor, Set<String> permitidos) {
        return valor != null && permitidos.contains(valor) ? valor : "otra";
    }

    private static void afterCommit(Runnable incremento) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Las métricas de solicitudes requieren una transacción activa");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                incremento.run();
            }
        });
    }
}
