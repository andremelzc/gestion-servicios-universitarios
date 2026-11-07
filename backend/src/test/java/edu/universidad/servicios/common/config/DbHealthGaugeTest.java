package edu.universidad.servicios.common.config;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.boot.health.actuate.endpoint.IndicatedHealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.health.contributor.Status;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DbHealthGaugeTest {

    @Test
    void reflejaElEstadoDelIndicadorDb() {
        HealthEndpoint endpoint = mock(HealthEndpoint.class);
        // HealthDescriptor es sealed; se simula la subclase final (mock-maker inline)
        IndicatedHealthDescriptor db = mock(IndicatedHealthDescriptor.class);
        when(endpoint.healthForPath("db")).thenReturn(db);
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        DbHealthGauge gauge = new DbHealthGauge(endpoint, registry);

        when(db.getStatus()).thenReturn(Status.DOWN);
        gauge.comprobar();
        assertThat(registry.get("health.db.up").gauge().value()).isEqualTo(0.0);

        when(db.getStatus()).thenReturn(Status.UP);
        gauge.comprobar();
        assertThat(registry.get("health.db.up").gauge().value()).isEqualTo(1.0);
    }
}
