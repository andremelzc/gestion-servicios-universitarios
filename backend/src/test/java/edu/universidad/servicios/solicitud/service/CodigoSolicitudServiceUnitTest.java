package edu.universidad.servicios.solicitud.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class CodigoSolicitudServiceUnitTest {

	@Test
	void generaCodigoConElAnioDelClockInyectado() {
		JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
		Clock clock = Clock.fixed(
			Instant.parse("2031-01-01T00:00:00Z"),
			ZoneOffset.UTC
		);
		when(
			jdbcTemplate.queryForObject(
				"SELECT LAST_INSERT_ID()",
				Integer.class
			)
		).thenReturn(27);
		var service = new CodigoSolicitudService(jdbcTemplate, clock);

		String codigo = service.generarCodigo();

		assertThat(codigo).isEqualTo("SOL-2031-0027");
		verify(jdbcTemplate).update(
			"""
			INSERT INTO secuencias_solicitud (anio, ultimo_numero)
			VALUES (?, LAST_INSERT_ID(1))
			ON DUPLICATE KEY UPDATE ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1)
			""",
			2031
		);
	}

	@Test
	void fallaSiLaBaseNoDevuelveElNumeroDeSecuencia() {
		JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
		Clock clock = Clock.fixed(
			Instant.parse("2031-01-01T00:00:00Z"),
			ZoneOffset.UTC
		);
		when(
			jdbcTemplate.queryForObject(
				"SELECT LAST_INSERT_ID()",
				Integer.class
			)
		).thenReturn(null);
		var service = new CodigoSolicitudService(jdbcTemplate, clock);

		assertThrows(IllegalStateException.class, service::generarCodigo);
	}
}
