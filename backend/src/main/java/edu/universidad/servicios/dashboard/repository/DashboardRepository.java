package edu.universidad.servicios.dashboard.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;

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

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public DashboardRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardKpis kpis(LocalDate desde, LocalDate hasta, Integer idArea, Long idTecnico) {
        MapSqlParameterSource parametros = new MapSqlParameterSource()
            .addValue("desde", Timestamp.valueOf(desde.atStartOfDay()))
            .addValue("hastaExclusivo", Timestamp.valueOf(hasta.plusDays(1).atStartOfDay()))
            .addValue("idArea", idArea)
            .addValue("idTecnico", idTecnico);

        return jdbcTemplate.queryForObject(CONSULTA_KPIS, parametros, (rs, rowNum) ->
            new DashboardKpis(
                rs.getLong("registradas"),
                rs.getLong("pendientes"),
                rs.getLong("atendidas"),
                rs.getBigDecimal("mttr_horas"),
                rs.getLong("vencidas")
            )
        );
    }
}
