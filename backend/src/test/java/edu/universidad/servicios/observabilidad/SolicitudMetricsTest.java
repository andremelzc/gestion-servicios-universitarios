package edu.universidad.servicios.observabilidad;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.solicitud.service.HistorialService;
import edu.universidad.servicios.solicitud.service.SolicitudMetrics;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Usuario;
import io.micrometer.prometheusmetrics.PrometheusConfig;
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class SolicitudMetricsTest {
    private final PrometheusMeterRegistry registry = new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);
    private final HistorialService historial = new HistorialService(mock(HistorialSolicitudRepository.class),
            new SolicitudMetrics(registry));
    private final TransactionTemplate tx = new TransactionTemplate(new DataSourceTransactionManager(
            new DriverManagerDataSource("jdbc:h2:mem:metrics;DB_CLOSE_DELAY=-1", "sa", "")));

    @Test
    void cuentaSoloAlConfirmarIncluyendoAtajoYReasignacion() {
        Solicitud solicitud = solicitud("ALTA", "Servicios Generales");
        EstadoSolicitud registrada = estado("REGISTRADA");
        EstadoSolicitud evaluacion = estado("EN_EVALUACION");
        EstadoSolicitud asignada = estado("ASIGNADA");
        tx.executeWithoutResult(status -> {
            historial.registrar(solicitud, new Usuario(), null, registrada, null);
            historial.registrar(solicitud, new Usuario(), registrada, evaluacion, null);
            historial.registrar(solicitud, new Usuario(), evaluacion, asignada, null);
            historial.registrar(solicitud, new Usuario(), asignada, asignada, null);
            assertThat(registry.scrape()).doesNotContain("solicitudes_creadas_total", "solicitudes_transiciones_total");
        });
        assertThat(registry.scrape())
                .contains("solicitudes_creadas_total{area=\"Servicios Generales\",prioridad=\"ALTA\"} 1.0")
                .contains("solicitudes_transiciones_total{desde=\"REGISTRADA\",hacia=\"EN_EVALUACION\"} 1.0")
                .contains("solicitudes_transiciones_total{desde=\"EN_EVALUACION\",hacia=\"ASIGNADA\"} 1.0")
                .contains("solicitudes_transiciones_total{desde=\"ASIGNADA\",hacia=\"ASIGNADA\"} 1.0");
    }

    @Test
    void rollbackYExcepcionNoIncrementan() {
        Solicitud solicitud = solicitud("ALTA", "Servicios Generales");
        tx.executeWithoutResult(status -> {
            historial.registrar(solicitud, new Usuario(), null, estado("REGISTRADA"), null);
            historial.registrar(solicitud, new Usuario(), estado("REGISTRADA"), estado("EN_EVALUACION"), null);
            status.setRollbackOnly();
        });
        assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
            historial.registrar(solicitud, new Usuario(), null, estado("REGISTRADA"), null);
            throw new IllegalStateException("fallo");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(registry.scrape()).doesNotContain("solicitudes_creadas_total", "solicitudes_transiciones_total");
    }

    @Test
    void agrupaValoresDesconocidosSinExponerDatosArbitrarios() {
        tx.executeWithoutResult(status -> {
            historial.registrar(solicitud("prioridad arbitraria", "area arbitraria"), new Usuario(), null, estado("REGISTRADA"), null);
            historial.registrar(new Solicitud(), new Usuario(), estado("estado arbitrario"), estado("otro estado"), null);
        });
        assertThat(registry.scrape())
                .contains("solicitudes_creadas_total{area=\"otra\",prioridad=\"otra\"} 1.0")
                .contains("solicitudes_transiciones_total{desde=\"otra\",hacia=\"otra\"} 1.0")
                .doesNotContain("arbitraria", "arbitrario", "otro estado");
    }

    private static Solicitud solicitud(String nivel, String nombreArea) {
        Prioridad prioridad = new Prioridad();
        prioridad.setNivel(nivel);
        Area area = new Area();
        area.setNombre(nombreArea);
        Categoria categoria = new Categoria();
        categoria.setArea(area);
        Solicitud solicitud = new Solicitud();
        solicitud.setPrioridad(prioridad);
        solicitud.setCategoria(categoria);
        return solicitud;
    }

    private static EstadoSolicitud estado(String codigo) {
        EstadoSolicitud estado = new EstadoSolicitud();
        estado.setCodigo(codigo);
        return estado;
    }
}
