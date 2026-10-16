package edu.universidad.servicios.persistencia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = "spring.flyway.enabled=true")
class PersistenciaIT extends AbstractIntegrationTest {

	@Autowired
	JdbcTemplate jdbcTemplate;

	@Test
	void flywayAplicaV1YV2ConTablasTriggersYConstraintsEsperados() {
		List<String> versiones = jdbcTemplate.queryForList(
			"SELECT version FROM flyway_schema_history WHERE success = TRUE ORDER BY installed_rank",
			String.class
		);
		assertThat(versiones).containsExactly("1", "2");

		assertThat(
			cantidad(
				"""
				SELECT COUNT(*) FROM information_schema.tables
				WHERE table_schema = DATABASE()
				  AND table_name IN ('solicitudes', 'historial_solicitudes')
				"""
			)
		).isEqualTo(2);
		assertThat(
			cantidad(
				"""
				SELECT COUNT(*) FROM information_schema.triggers
				WHERE trigger_schema = DATABASE()
				  AND trigger_name IN ('trg_historial_no_update', 'trg_historial_no_delete')
				"""
			)
		).isEqualTo(2);
		assertThat(
			cantidad(
				"""
				SELECT COUNT(*) FROM information_schema.table_constraints
				WHERE constraint_schema = DATABASE()
				  AND ((table_name = 'categorias' AND constraint_name = 'ck_categorias_sla')
				    OR (table_name = 'solicitudes' AND constraint_name = 'fk_solicitudes_estado'))
				"""
			)
		).isEqualTo(2);
		assertThat(cantidad("SELECT COUNT(*) FROM areas")).isEqualTo(3);
		assertThat(
			cantidad("SELECT COUNT(*) FROM estados_solicitud")
		).isEqualTo(6);
	}

	@Test
	void mysqlRechazaViolacionesCheckForeignKeyYUnique() {
		Integer areaId = jdbcTemplate.queryForObject(
			"SELECT id FROM areas WHERE nombre = 'Tecnologías de la Información'",
			Integer.class
		);

		assertThatThrownBy(() ->
			jdbcTemplate.update(
				"INSERT INTO categorias (nombre, id_area, tiempo_sla_horas) VALUES (?, ?, 0)",
				"QA05-SLA-INVALIDO",
				areaId
			)
		).isInstanceOf(DataAccessException.class);
		assertThatThrownBy(() ->
			jdbcTemplate.update(
				"INSERT INTO categorias (nombre, id_area, tiempo_sla_horas) VALUES (?, ?, 1)",
				"QA05-AREA-INEXISTENTE",
				Integer.MAX_VALUE
			)
		).isInstanceOf(DataAccessException.class);
		assertThatThrownBy(() ->
			jdbcTemplate.update(
				"INSERT INTO roles (nombre, descripcion) VALUES (?, ?)",
				"ROLE_ESTUDIANTE",
				"duplicado QA-05"
			)
		).isInstanceOf(DataAccessException.class);

		assertThat(
			cantidad(
				"SELECT COUNT(*) FROM categorias WHERE nombre LIKE 'QA05-%'"
			)
		).isZero();
	}

	private int cantidad(String sql) {
		return jdbcTemplate.queryForObject(sql, Integer.class);
	}
}
