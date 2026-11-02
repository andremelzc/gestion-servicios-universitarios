package edu.universidad.servicios.common.config;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.health.actuate.endpoint.HealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.health.contributor.Status;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * OBS-10: publica {@code health_db_up} (1 = UP, 0 = otro estado) para la alerta BDInaccesible.
 * La comprobación corre en segundo plano y el gauge solo lee el último resultado: si se
 * consultara la salud durante el scrape, una BD caída bloquearía hasta el timeout de Hikari
 * (30 s), el scrape fallaría y se dispararía InstanciaCaida en lugar de BDInaccesible.
 */
@Component
@EnableScheduling
public class DbHealthGauge {

    private final HealthEndpoint healthEndpoint;
    private final AtomicInteger dbUp = new AtomicInteger(1);

    public DbHealthGauge(HealthEndpoint healthEndpoint, MeterRegistry registry) {
        this.healthEndpoint = healthEndpoint;
        Gauge.builder("health.db.up", dbUp, AtomicInteger::get)
                .description("Estado del indicador de salud db (1 = UP)")
                .register(registry);
    }

    @Scheduled(fixedDelayString = "${app.health.db-check-ms:15000}")
    void comprobar() {
        HealthDescriptor db = healthEndpoint.healthForPath("db");
        dbUp.set(db != null && Status.UP.equals(db.getStatus()) ? 1 : 0);
    }
}
