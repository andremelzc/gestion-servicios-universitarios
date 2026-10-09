package edu.universidad.servicios.solicitud.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
public class CodigoSolicitudService {

    private static final String INCREMENTAR_SECUENCIA = """
        INSERT INTO secuencias_solicitud (anio, ultimo_numero)
        VALUES (?, LAST_INSERT_ID(1))
        ON DUPLICATE KEY UPDATE ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1)
        """;

    private final JdbcTemplate jdbcTemplate;

    public CodigoSolicitudService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public String generarCodigo() {
        int anio = Year.now().getValue();
        jdbcTemplate.update(INCREMENTAR_SECUENCIA, anio);
        Integer numero = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        if (numero == null) {
            throw new IllegalStateException("No se pudo obtener el número de secuencia de solicitud");
        }
        return "SOL-%d-%04d".formatted(anio, numero);
    }
}
