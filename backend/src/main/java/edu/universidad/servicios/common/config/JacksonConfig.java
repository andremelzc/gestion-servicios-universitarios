package edu.universidad.servicios.common.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Configuración global de Jackson para el proyecto.
 *
 * <p>Habilita {@code FAIL_ON_UNKNOWN_PROPERTIES} para que campos
 * inesperados como {@code "rol"} en {@code /auth/registro} produzcan
 * un {@code 400 Bad Request} inmediato (CA-6, RN-04).</p>
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return Jackson2ObjectMapperBuilder.json()
                .featuresToEnable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
    }
}
