package edu.universidad.servicios.config;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractIntegrationTest {

	@Container
	@ServiceConnection
	protected static final MySQLContainer<?> MYSQL_CONTAINER =
		new MySQLContainer<>("mysql:8.0.36")
			.withDatabaseName("gestion_servicios_test")
			.withUsername("test_user")
			.withPassword("test_password")
			.withCommand("--log-bin-trust-function-creators=1")
			.withReuse(true);
}
