package edu.universidad.servicios.solicitud.service;

import static org.assertj.core.api.Assertions.assertThat;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import java.time.Year;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class CodigoSolicitudServiceTest extends AbstractIntegrationTest {

	private static final int CANTIDAD_SOLICITUDES = 40;

	@Autowired
	private CodigoSolicitudService codigoSolicitudService;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void generaCodigosConcurrentesSinDuplicados() throws Exception {
		int anio = Year.now().getValue();
		jdbcTemplate.update(
			"DELETE FROM secuencias_solicitud WHERE anio = ?",
			anio
		);

		try (ExecutorService executor = Executors.newFixedThreadPool(10)) {
			List<Future<String>> resultados = executor.invokeAll(
				java.util.stream.IntStream.range(0, CANTIDAD_SOLICITUDES)
					.<java.util.concurrent.Callable<String>>mapToObj(
						i -> codigoSolicitudService::generarCodigo
					)
					.toList()
			);

			List<String> codigos = new java.util.ArrayList<>();
			for (Future<String> resultado : resultados) {
				codigos.add(resultado.get());
			}

			assertThat(codigos)
				.hasSize(CANTIDAD_SOLICITUDES)
				.doesNotHaveDuplicates();
			assertThat(codigos).contains(
				"SOL-%d-0001".formatted(anio),
				"SOL-%d-%04d".formatted(anio, CANTIDAD_SOLICITUDES)
			);
		}

		Integer ultimoNumero = jdbcTemplate.queryForObject(
			"SELECT ultimo_numero FROM secuencias_solicitud WHERE anio = ?",
			Integer.class,
			anio
		);
		assertThat(ultimoNumero).isEqualTo(CANTIDAD_SOLICITUDES);
	}
}
