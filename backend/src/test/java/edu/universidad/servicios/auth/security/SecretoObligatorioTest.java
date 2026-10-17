package edu.universidad.servicios.auth.security;

import edu.universidad.servicios.ServiciosApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class SecretoObligatorioTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(ServiciosApplication.class)
            .withPropertyValues(
                    "spring.profiles.active=test",
                    "spring.flyway.enabled=false",
                    "spring.datasource.url=jdbc:h2:mem:secreto_test;DB_CLOSE_DELAY=-1",
                    "spring.datasource.driver-class-name=org.h2.Driver"
            );

    @Test
    @DisplayName("Falla al arrancar si JWT_SECRET no está definido")
    void fallaCuandoFaltaVariableJwtSecret() {
        contextRunner
                .withPropertyValues("app.jwt.secret=")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalArgumentException.class)
                            .hasRootCauseMessage("JWT_SECRET must be at least 32 bytes long.");
                });
    }

    @Test
    @DisplayName("Falla al arrancar si JWT_SECRET está vacío o contiene solo espacios")
    void fallaCuandoJwtSecretEstaVacio() {
        contextRunner
                .withPropertyValues("app.jwt.secret=   ")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalArgumentException.class)
                            .hasRootCauseMessage("JWT_SECRET must be at least 32 bytes long.");
                });
    }

    private static final String SECRETO_TEST_CORTO = "x".repeat(16);
    private static final String SECRETO_TEST_VALIDO = "x".repeat(32);

    @Test
    @DisplayName("Falla al arrancar si JWT_SECRET tiene menos de 32 bytes")
    void fallaCuandoJwtSecretEsMenorA32Bytes() {
        contextRunner
                .withPropertyValues("app.jwt.secret=" + SECRETO_TEST_CORTO)
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalArgumentException.class)
                            .hasRootCauseMessage("JWT_SECRET must be at least 32 bytes long.");
                });
    }

    @Test
    @DisplayName("Arranca exitosamente si JWT_SECRET tiene al menos 32 bytes")
    void arrancaExitosamenteConSecretoValido() {
        contextRunner
                .withPropertyValues("app.jwt.secret=" + SECRETO_TEST_VALIDO)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(JwtService.class);
                });
    }
}
