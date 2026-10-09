package edu.universidad.servicios.solicitud;

import static org.assertj.core.api.Assertions.assertThat;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.dashboard.repository.DashboardKpis;
import edu.universidad.servicios.dashboard.repository.DashboardRepository;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

@TestPropertySource(properties = "spring.flyway.enabled=true")
class DashboardRepositoryIT extends AbstractIntegrationTest {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private DashboardRepository dashboardRepository;

	@Test
	void flywayCargaCatalogosMaestros() {
		assertThat(cantidad("areas")).isEqualTo(3);
		assertThat(cantidad("categorias")).isEqualTo(6);
		assertThat(cantidad("prioridades")).isEqualTo(4);
		assertThat(cantidad("estados_solicitud")).isEqualTo(6);
	}

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void datasetIncluye150SolicitudesEnSeisEstadosDosAreasYFechasVariadas() {
		assertThat(cantidadSolicitudesDataset()).isEqualTo(150);

		Map<String, Long> porEstado = jdbcTemplate
			.query(
				"SELECT estado, COUNT(*) AS cantidad FROM solicitudes " +
					"WHERE codigo LIKE 'DASH-01-%' GROUP BY estado",
				(resultSet, rowNum) ->
					Map.entry(
						resultSet.getString("estado"),
						resultSet.getLong("cantidad")
					)
			)
			.stream()
			.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
		assertThat(porEstado).containsExactlyInAnyOrderEntriesOf(
			Map.of(
				"REGISTRADA",
				14L,
				"EN_EVALUACION",
				22L,
				"ASIGNADA",
				9L,
				"EN_ATENCION",
				5L,
				"RESUELTA",
				30L,
				"CERRADA",
				70L
			)
		);

		Map<String, Long> porArea = jdbcTemplate
			.query(
				"SELECT a.nombre, COUNT(*) AS cantidad " +
					"FROM solicitudes s " +
					"JOIN categorias c ON c.id = s.id_categoria " +
					"JOIN areas a ON a.id = c.id_area " +
					"WHERE s.codigo LIKE 'DASH-01-%' GROUP BY a.nombre",
				(resultSet, rowNum) ->
					Map.entry(
						resultSet.getString("nombre"),
						resultSet.getLong("cantidad")
					)
			)
			.stream()
			.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
		assertThat(porArea).containsExactlyInAnyOrderEntriesOf(
			Map.of(
				"Tecnologías de la Información",
				75L,
				"Mantenimiento e Infraestructura",
				75L
			)
		);

		Integer fechasDistintas = jdbcTemplate.queryForObject(
			"SELECT COUNT(DISTINCT DATE(fecha_registro)) FROM solicitudes " +
				"WHERE codigo LIKE 'DASH-01-%'",
			Integer.class
		);
		assertThat(fechasDistintas).isEqualTo(90);

		LocalDateTime fechaMinima = jdbcTemplate.queryForObject(
			"SELECT MIN(fecha_registro) FROM solicitudes WHERE codigo LIKE 'DASH-01-%'",
			LocalDateTime.class
		);
		LocalDateTime fechaMaxima = jdbcTemplate.queryForObject(
			"SELECT MAX(fecha_registro) FROM solicitudes WHERE codigo LIKE 'DASH-01-%'",
			LocalDateTime.class
		);
		assertThat(fechaMinima).isNotNull();
		assertThat(fechaMaxima).isNotNull();
		assertThat(
			java.time.Duration.between(fechaMinima, fechaMaxima).toDays()
		).isEqualTo(89);
	}

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void kpisGlobalesCumplenCa1() {
		DashboardKpis kpis = dashboardRepository.kpis(
			java.time.LocalDate.of(2026, 7, 12),
			java.time.LocalDate.of(2026, 10, 9),
			null,
			null
		);

		assertThat(kpis.registradas()).isEqualTo(150);
		assertThat(kpis.pendientes()).isEqualTo(50);
		assertThat(kpis.atendidas()).isEqualTo(100);
		assertThat(kpis.mttrHoras()).isEqualByComparingTo("9.4");
	}

	@Test
	@Sql({ "/datasets/dashboard-150.sql", "/datasets/dashboard-mttr-4.sql" })
	void mttrIgnoraSolicitudesSinFechaDeResolucionSegunCa7() {
		DashboardKpis kpis = dashboardRepository.kpis(
			java.time.LocalDate.of(2025, 1, 1),
			java.time.LocalDate.of(2025, 1, 1),
			null,
			null
		);

		assertThat(kpis.registradas()).isEqualTo(4);
		assertThat(kpis.pendientes()).isEqualTo(1);
		assertThat(kpis.atendidas()).isEqualTo(3);
		assertThat(kpis.mttrHoras()).isEqualByComparingTo("4.0");
		assertThat(kpis.vencidas()).isEqualTo(1);
	}

	private int cantidad(String tabla) {
		return jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM " + tabla,
			Integer.class
		);
	}

	private int cantidadSolicitudesDataset() {
		return jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM solicitudes WHERE codigo LIKE 'DASH-01-%'",
			Integer.class
		);
	}
}
