package edu.universidad.servicios.solicitud.service;

import java.time.Clock;
import java.time.Year;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CodigoSolicitudService {

	private static final String INCREMENTAR_SECUENCIA = """
	INSERT INTO secuencias_solicitud (anio, ultimo_numero)
	VALUES (?, LAST_INSERT_ID(1))
	ON DUPLICATE KEY UPDATE ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1)
	""";

	private final JdbcTemplate jdbcTemplate;
	private final Clock clock;

	public CodigoSolicitudService(JdbcTemplate jdbcTemplate, Clock clock) {
		this.jdbcTemplate = jdbcTemplate;
		this.clock = clock;
	}

	@Transactional
	public String generarCodigo() {
		int anio = Year.now(clock).getValue();
		jdbcTemplate.update(INCREMENTAR_SECUENCIA, anio);
		Integer numero = jdbcTemplate.queryForObject(
			"SELECT LAST_INSERT_ID()",
			Integer.class
		);
		if (numero == null) {
			throw new IllegalStateException(
				"No se pudo obtener el número de secuencia de solicitud"
			);
		}
		return "SOL-%d-%04d".formatted(anio, numero);
	}
}
