package edu.universidad.servicios.solicitud;

import static org.assertj.core.api.Assertions.assertThat;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.dashboard.dto.SerieEstadoItem;
import edu.universidad.servicios.dashboard.dto.SerieItem;
import edu.universidad.servicios.dashboard.repository.DashboardKpis;
import edu.universidad.servicios.dashboard.repository.DashboardRepository;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

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

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void seriesPorCategoriaYPrioridadRespetanFiltrosYOrden() {
		LocalDate desde = LocalDate.of(2026, 7, 12);
		LocalDate hasta = LocalDate.of(2026, 10, 9);
		List<SerieItem> categorias = dashboardRepository.porCategoria(
			desde,
			hasta,
			null,
			null
		);
		assertThat(
			categorias.stream().mapToLong(SerieItem::valor).sum()
		).isEqualTo(150);
		assertThat(
			dashboardRepository.porPrioridad(desde, hasta, null, null)
		).containsExactly(
			new SerieItem("BAJA", 38),
			new SerieItem("MEDIA", 38),
			new SerieItem("ALTA", 37),
			new SerieItem("CRITICA", 37)
		);

		Integer areaTi = jdbcTemplate.queryForObject(
			"SELECT id FROM areas WHERE nombre = 'Tecnologías de la Información'",
			Integer.class
		);
		assertThat(
			dashboardRepository
				.porCategoria(desde, hasta, areaTi, null)
				.stream()
				.mapToLong(SerieItem::valor)
				.sum()
		).isEqualTo(75);
		assertThat(
			dashboardRepository.porPrioridad(
				LocalDate.of(2026, 10, 9),
				LocalDate.of(2026, 10, 9),
				areaTi,
				null
			)
		).containsExactly(
			new SerieItem("BAJA", 1),
			new SerieItem("MEDIA", 0),
			new SerieItem("ALTA", 1),
			new SerieItem("CRITICA", 0)
		);
	}

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void seriePorEstadoIncluyeCerosColorYOrden() {
		List<SerieEstadoItem> estados = dashboardRepository.porEstado(
			LocalDate.of(2026, 10, 9),
			LocalDate.of(2026, 10, 9),
			null,
			null
		);
		assertThat(estados).containsExactly(
			new SerieEstadoItem("REGISTRADA", 1, "#6B7280"),
			new SerieEstadoItem("EN_EVALUACION", 0, "#D97706"),
			new SerieEstadoItem("ASIGNADA", 0, "#2563EB"),
			new SerieEstadoItem("EN_ATENCION", 0, "#7C3AED"),
			new SerieEstadoItem("RESUELTA", 0, "#059669"),
			new SerieEstadoItem("CERRADA", 1, "#047857")
		);
	}

	@Test
	@Transactional
	@Sql("/datasets/dashboard-150.sql")
	void seriePorResponsableExcluyeSinAsignarYOrdenaPorCantidad() {
		jdbcTemplate.update(
			"""
			INSERT INTO usuarios (codigo_institucional, nombre, apellido, correo, password_hash, id_rol)
			SELECT 'DASH03-TEC-1', 'Carlos', 'Ruiz', 'dash03.tec1@universidad.test', 'test-only', id
			FROM roles WHERE nombre = 'ROLE_TECNICO'
			"""
		);
		jdbcTemplate.update(
			"""
			INSERT INTO usuarios (codigo_institucional, nombre, apellido, correo, password_hash, id_rol)
			SELECT 'DASH03-TEC-2', 'Lucía', 'Vega', 'dash03.tec2@universidad.test', 'test-only', id
			FROM roles WHERE nombre = 'ROLE_TECNICO'
			"""
		);
		jdbcTemplate.update(
			"""
			UPDATE solicitudes SET id_tecnico_asignado =
			(SELECT id FROM usuarios WHERE codigo_institucional = 'DASH03-TEC-1')
			WHERE codigo IN ('DASH-01-0001', 'DASH-01-0002', 'DASH-01-0003')
			"""
		);
		jdbcTemplate.update(
			"""
			UPDATE solicitudes SET id_tecnico_asignado =
			(SELECT id FROM usuarios WHERE codigo_institucional = 'DASH03-TEC-2')
			WHERE codigo = 'DASH-01-0004'
			"""
		);
		LocalDate desde = LocalDate.of(2026, 7, 12);
		LocalDate hasta = LocalDate.of(2026, 10, 9);
		Long carlos = jdbcTemplate.queryForObject(
			"SELECT id FROM usuarios WHERE codigo_institucional = 'DASH03-TEC-1'",
			Long.class
		);
		assertThat(
			dashboardRepository.porResponsable(desde, hasta, null, null)
		).containsExactly(
			new SerieItem("Carlos Ruiz", 3),
			new SerieItem("Lucía Vega", 1)
		);
		assertThat(
			dashboardRepository.porResponsable(desde, hasta, null, carlos)
		).containsExactly(new SerieItem("Carlos Ruiz", 3));
		assertThat(
			dashboardRepository
				.porCategoria(desde, hasta, null, carlos)
				.stream()
				.mapToLong(SerieItem::valor)
				.sum()
		).isEqualTo(3);
		assertThat(
			dashboardRepository
				.porPrioridad(desde, hasta, null, carlos)
				.stream()
				.mapToLong(SerieItem::valor)
				.sum()
		).isEqualTo(3);
		assertThat(
			dashboardRepository
				.porEstado(desde, hasta, null, carlos)
				.stream()
				.mapToLong(SerieEstadoItem::valor)
				.sum()
		).isEqualTo(3);
	}

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void vencidasPaginadasSoloPendientesOrdenadasPorMayorRetraso() {
		LocalDate desde = LocalDate.of(2026, 7, 12);
		LocalDate hasta = LocalDate.of(2026, 10, 9);
		Page<SolicitudResumenResponse> primera = dashboardRepository.vencidas(
			desde,
			hasta,
			null,
			null,
			PageRequest.of(0, 10)
		);
		Page<SolicitudResumenResponse> segunda = dashboardRepository.vencidas(
			desde,
			hasta,
			null,
			null,
			PageRequest.of(1, 10)
		);
		assertThat(primera.getTotalElements()).isEqualTo(50);
		assertThat(primera.getTotalPages()).isEqualTo(5);
		assertThat(primera.getContent())
			.hasSize(10)
			.allSatisfy(item ->
				assertThat(item.estadoCodigo()).isIn(
					"REGISTRADA",
					"EN_EVALUACION",
					"ASIGNADA",
					"EN_ATENCION"
				)
			);
		assertThat(
			primera
				.getContent()
				.stream()
				.map(SolicitudResumenResponse::fechaLimiteSla)
		).isSorted();
		assertThat(
			primera.getContent().getLast().fechaLimiteSla()
		).isBeforeOrEqualTo(segunda.getContent().getFirst().fechaLimiteSla());
		assertThat(
			primera
				.getContent()
				.stream()
				.map(SolicitudResumenResponse::id)
				.toList()
		).doesNotContainAnyElementsOf(
			segunda
				.getContent()
				.stream()
				.map(SolicitudResumenResponse::id)
				.toList()
		);

		Integer areaTi = jdbcTemplate.queryForObject(
			"SELECT id FROM areas WHERE nombre = 'Tecnologías de la Información'",
			Integer.class
		);
		assertThat(
			dashboardRepository
				.vencidas(desde, hasta, areaTi, null, PageRequest.of(0, 10))
				.getTotalElements()
		).isEqualTo(25);
	}

	@Test
	@Sql({ "/datasets/dashboard-150.sql", "/datasets/dashboard-mttr-4.sql" })
	void vencidasExcluyeResueltasAunConSlaPasadoYRespetaFechas() {
		Page<SolicitudResumenResponse> resultado = dashboardRepository.vencidas(
			LocalDate.of(2025, 1, 1),
			LocalDate.of(2025, 1, 1),
			null,
			null,
			PageRequest.of(0, 2)
		);
		assertThat(resultado.getTotalElements()).isEqualTo(1);
		assertThat(resultado.getContent())
			.singleElement()
			.extracting(SolicitudResumenResponse::codigo)
			.isEqualTo("DASH-02-MTTR-OPEN");
		assertThat(
			dashboardRepository
				.vencidas(
					LocalDate.of(2025, 1, 2),
					LocalDate.of(2025, 1, 2),
					null,
					null,
					PageRequest.of(0, 2)
				)
				.getTotalElements()
		).isZero();
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
