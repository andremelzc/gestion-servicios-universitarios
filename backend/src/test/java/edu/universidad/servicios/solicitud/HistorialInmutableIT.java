package edu.universidad.servicios.solicitud;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import java.sql.SQLException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@TestPropertySource(properties = "spring.flyway.enabled=true")
class HistorialInmutableIT extends AbstractIntegrationTest {

	@Autowired
	JdbcTemplate jdbcTemplate;

	@Autowired
	PlatformTransactionManager transactionManager;

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void triggersRechazanUpdateYDeleteConSqlstate45000() {
		new TransactionTemplate(transactionManager).executeWithoutResult(
			status -> {
				jdbcTemplate.update(
					"""
					INSERT INTO historial_solicitudes (id_solicitud, id_usuario, estado_nuevo, nota)
					SELECT id, id_usuario_solicitante, estado, 'original'
					FROM solicitudes WHERE codigo = 'DASH-01-0001'
					"""
				);
				Long id = jdbcTemplate.queryForObject(
					"SELECT id FROM historial_solicitudes WHERE nota = 'original'",
					Long.class
				);

				assertSqlstate45000(() ->
					jdbcTemplate.update(
						"UPDATE historial_solicitudes SET nota = 'modificado' WHERE id = ?",
						id
					)
				);
				assertSqlstate45000(() ->
					jdbcTemplate.update(
						"DELETE FROM historial_solicitudes WHERE id = ?",
						id
					)
				);

				assertThat(
					jdbcTemplate.queryForObject(
						"SELECT nota FROM historial_solicitudes WHERE id = ?",
						String.class,
						id
					)
				).isEqualTo("original");
				status.setRollbackOnly();
			}
		);
	}

	@Test
	@Sql("/datasets/dashboard-150.sql")
	void errorAlInsertarHistorialRevierteElCambioDeEstado() {
		Long id = jdbcTemplate.queryForObject(
			"SELECT id FROM solicitudes WHERE codigo = 'DASH-01-0001'",
			Long.class
		);
		String estadoOriginal = jdbcTemplate.queryForObject(
			"SELECT estado FROM solicitudes WHERE id = ?",
			String.class,
			id
		);
		TransactionTemplate transaction = new TransactionTemplate(
			transactionManager
		);

		assertThatThrownBy(() ->
			transaction.executeWithoutResult(status -> {
				jdbcTemplate.update(
					"UPDATE solicitudes SET estado = 'EN_EVALUACION' WHERE id = ?",
					id
				);
				jdbcTemplate.update(
					"""
					INSERT INTO historial_solicitudes
					    (id_solicitud, id_usuario, estado_anterior, estado_nuevo)
					VALUES (?, -1, 'REGISTRADA', 'EN_EVALUACION')
					""",
					id
				);
			})
		).isInstanceOf(DataAccessException.class);

		assertThat(
			jdbcTemplate.queryForObject(
				"SELECT estado FROM solicitudes WHERE id = ?",
				String.class,
				id
			)
		).isEqualTo(estadoOriginal);
	}

	private void assertSqlstate45000(ThrowingSqlOperation operation) {
		assertThatThrownBy(operation::run)
			.isInstanceOf(DataAccessException.class)
			.satisfies(error ->
				assertThat(
					(
						(SQLException) (
							(DataAccessException) error
						).getMostSpecificCause()
					).getSQLState()
				).isEqualTo("45000")
			);
	}

	@FunctionalInterface
	private interface ThrowingSqlOperation {
		void run();
	}
}
