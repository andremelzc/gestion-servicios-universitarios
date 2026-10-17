package edu.universidad.servicios.dashboard.repository;

import edu.universidad.servicios.dashboard.dto.SerieEstadoItem;
import edu.universidad.servicios.dashboard.dto.SerieItem;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardRepository {

	private static final String CONSULTA_KPIS = """
	SELECT
	    COUNT(*) AS registradas,
	    COALESCE(SUM(CASE
	        WHEN s.estado IN ('REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION')
	        THEN 1 ELSE 0
	    END), 0) AS pendientes,
	    COALESCE(SUM(CASE
	        WHEN s.estado IN ('RESUELTA', 'CERRADA')
	        THEN 1 ELSE 0
	    END), 0) AS atendidas,
	    AVG(CASE
	        WHEN s.fecha_resolucion IS NOT NULL
	        THEN TIMESTAMPDIFF(MINUTE, s.fecha_registro, s.fecha_resolucion) / 60.0
	    END) AS mttr_horas,
	    COALESCE(SUM(CASE
	        WHEN s.estado IN ('REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION')
	            AND s.fecha_limite_sla < UTC_TIMESTAMP()
	        THEN 1 ELSE 0
	    END), 0) AS vencidas
	FROM solicitudes s
	JOIN categorias c ON c.id = s.id_categoria
	WHERE s.fecha_registro >= :desde
	  AND s.fecha_registro < :hastaExclusivo
	  AND (:idArea IS NULL OR c.id_area = :idArea)
	  AND (:idTecnico IS NULL OR s.id_tecnico_asignado = :idTecnico)
	""";

	private static final String FILTRO_SOLICITUDES = """
	WHERE s.fecha_registro >= :desde
	  AND s.fecha_registro < :hastaExclusivo
	  AND (:idArea IS NULL OR c.id_area = :idArea)
	  AND (:idTecnico IS NULL OR s.id_tecnico_asignado = :idTecnico)
	""";

	private static final String SOLICITUDES_FILTRADAS =
		"""
		SELECT s.id_categoria, s.id_prioridad, s.estado, s.id_tecnico_asignado
		FROM solicitudes s
		JOIN categorias c ON c.id = s.id_categoria
		""" + FILTRO_SOLICITUDES;

	private static final String CONSULTA_POR_CATEGORIA =
		"""
		SELECT c.nombre AS nombre, COUNT(*) AS valor
		FROM solicitudes s
		JOIN categorias c ON c.id = s.id_categoria
		""" +
		FILTRO_SOLICITUDES +
		" GROUP BY c.id, c.nombre ORDER BY c.nombre";

	private static final String CONSULTA_POR_PRIORIDAD =
		"""
		SELECT p.nivel AS nombre, COUNT(s.id_prioridad) AS valor
		FROM (
		""" +
		SOLICITUDES_FILTRADAS +
		"""
		) s RIGHT JOIN prioridades p ON p.id = s.id_prioridad
		GROUP BY p.id, p.nivel, p.ponderador
		ORDER BY p.ponderador, p.id
		""";

	private static final String CONSULTA_POR_ESTADO =
		"""
		SELECT e.codigo AS nombre, COUNT(s.estado) AS valor, e.color_hex AS color_hex
		FROM estados_solicitud e
		LEFT JOIN (
		""" +
		SOLICITUDES_FILTRADAS +
		"""
		) s ON s.estado = e.codigo
		GROUP BY e.codigo, e.color_hex, e.orden
		ORDER BY e.orden, e.codigo
		""";

	private static final String CONSULTA_POR_RESPONSABLE =
		"""
		SELECT CONCAT(u.nombre, ' ', u.apellido) AS nombre, COUNT(*) AS valor
		FROM solicitudes s
		JOIN categorias c ON c.id = s.id_categoria
		JOIN usuarios u ON u.id = s.id_tecnico_asignado
		""" +
		FILTRO_SOLICITUDES +
		" GROUP BY u.id, u.nombre, u.apellido ORDER BY valor DESC, u.id";

	private static final String CONSULTA_VENCIDAS_DESDE = """
	FROM solicitudes s
	JOIN categorias c ON c.id = s.id_categoria
	""";

	private static final String FILTRO_VENCIDAS =
		FILTRO_SOLICITUDES +
		"""
		AND s.estado IN ('REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION')
		AND s.fecha_limite_sla < UTC_TIMESTAMP()
		""";

	private static final String CONSULTA_VENCIDAS =
		"""
		SELECT s.id, s.codigo, s.titulo, c.nombre AS categoria_nombre,
		       p.nivel AS prioridad_nivel, e.codigo AS estado_codigo,
		       e.nombre_visible AS estado_nombre, e.color_hex AS estado_color_hex,
		       CONCAT(u.nombre, ' ', u.apellido) AS tecnico_nombre,
		       s.fecha_registro, s.fecha_limite_sla
		""" +
		CONSULTA_VENCIDAS_DESDE +
		"""
		JOIN prioridades p ON p.id = s.id_prioridad
		JOIN estados_solicitud e ON e.codigo = s.estado
		LEFT JOIN usuarios u ON u.id = s.id_tecnico_asignado
		""" +
		FILTRO_VENCIDAS +
		" ORDER BY s.fecha_limite_sla ASC, s.id ASC LIMIT :limite OFFSET :offset";

	private static final String CONSULTA_TOTAL_VENCIDAS =
		"SELECT COUNT(*) " + CONSULTA_VENCIDAS_DESDE + FILTRO_VENCIDAS;

	private final NamedParameterJdbcTemplate jdbcTemplate;

	public DashboardRepository(NamedParameterJdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public DashboardKpis kpis(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return jdbcTemplate.queryForObject(
			CONSULTA_KPIS,
			parametros(desde, hasta, idArea, idTecnico),
			(rs, rowNum) ->
				new DashboardKpis(
					rs.getLong("registradas"),
					rs.getLong("pendientes"),
					rs.getLong("atendidas"),
					rs.getBigDecimal("mttr_horas"),
					rs.getLong("vencidas")
				)
		);
	}

	public List<SerieItem> porCategoria(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return jdbcTemplate.query(
			CONSULTA_POR_CATEGORIA,
			parametros(desde, hasta, idArea, idTecnico),
			(rs, rowNum) ->
				new SerieItem(rs.getString("nombre"), rs.getLong("valor"))
		);
	}

	public List<SerieItem> porPrioridad(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return jdbcTemplate.query(
			CONSULTA_POR_PRIORIDAD,
			parametros(desde, hasta, idArea, idTecnico),
			(rs, rowNum) ->
				new SerieItem(rs.getString("nombre"), rs.getLong("valor"))
		);
	}

	public List<SerieEstadoItem> porEstado(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return jdbcTemplate.query(
			CONSULTA_POR_ESTADO,
			parametros(desde, hasta, idArea, idTecnico),
			(rs, rowNum) ->
				new SerieEstadoItem(
					rs.getString("nombre"),
					rs.getLong("valor"),
					rs.getString("color_hex")
				)
		);
	}

	public List<SerieItem> porResponsable(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return jdbcTemplate.query(
			CONSULTA_POR_RESPONSABLE,
			parametros(desde, hasta, idArea, idTecnico),
			(rs, rowNum) ->
				new SerieItem(rs.getString("nombre"), rs.getLong("valor"))
		);
	}

	public Page<SolicitudResumenResponse> vencidas(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico,
		Pageable pageable
	) {
		if (pageable.isUnpaged()) {
			throw new IllegalArgumentException(
				"La consulta de vencidas requiere paginación"
			);
		}
		MapSqlParameterSource parametros = parametros(
			desde,
			hasta,
			idArea,
			idTecnico
		);
		Long total = jdbcTemplate.queryForObject(
			CONSULTA_TOTAL_VENCIDAS,
			parametros,
			Long.class
		);
		parametros
			.addValue("limite", pageable.getPageSize())
			.addValue("offset", pageable.getOffset());
		List<SolicitudResumenResponse> contenido = jdbcTemplate.query(
			CONSULTA_VENCIDAS,
			parametros,
			(rs, rowNum) ->
				new SolicitudResumenResponse(
					rs.getLong("id"),
					rs.getString("codigo"),
					rs.getString("titulo"),
					rs.getString("categoria_nombre"),
					rs.getString("prioridad_nivel"),
					rs.getString("estado_codigo"),
					rs.getString("estado_nombre"),
					rs.getString("estado_color_hex"),
					rs.getString("tecnico_nombre"),
					rs.getTimestamp("fecha_registro").toLocalDateTime(),
					rs.getTimestamp("fecha_limite_sla").toLocalDateTime()
				)
		);
		return new PageImpl<>(contenido, pageable, total);
	}

	private MapSqlParameterSource parametros(
		LocalDate desde,
		LocalDate hasta,
		Integer idArea,
		Long idTecnico
	) {
		return new MapSqlParameterSource()
			.addValue("desde", Timestamp.valueOf(desde.atStartOfDay()))
			.addValue(
				"hastaExclusivo",
				Timestamp.valueOf(hasta.plusDays(1).atStartOfDay())
			)
			.addValue("idArea", idArea)
			.addValue("idTecnico", idTecnico);
	}
}
