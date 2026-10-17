package edu.universidad.servicios.common.config;

import io.micrometer.prometheusmetrics.PrometheusConfig;
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry;
import io.prometheus.metrics.model.registry.PrometheusRegistry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.micrometer.metrics.autoconfigure.export.prometheus.PrometheusScrapeEndpoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

/**
 * Configuración explícita del MeterRegistry de Prometheus y el endpoint de scrape de Actuator (OBS-01).
 */
@Configuration
@ConditionalOnClass({PrometheusMeterRegistry.class, PrometheusScrapeEndpoint.class})
public class PrometheusEndpointConfig {

    @Bean
    @ConditionalOnMissingBean
    public PrometheusRegistry prometheusRegistry() {
        return new PrometheusRegistry();
    }

    @Bean
    @ConditionalOnMissingBean
    public PrometheusConfig prometheusConfig() {
        return PrometheusConfig.DEFAULT;
    }

    @Bean
    @ConditionalOnMissingBean
    public PrometheusMeterRegistry prometheusMeterRegistry(
            PrometheusConfig prometheusConfig,
            PrometheusRegistry prometheusRegistry,
            io.micrometer.core.instrument.Clock micrometerClock) {
        return new PrometheusMeterRegistry(prometheusConfig, prometheusRegistry, micrometerClock);
    }

    @Bean
    @ConditionalOnMissingBean
    public PrometheusScrapeEndpoint prometheusEndpoint(PrometheusRegistry prometheusRegistry) {
        return new PrometheusScrapeEndpoint(prometheusRegistry, new Properties());
    }
}
