package edu.universidad.servicios.config;

import edu.universidad.servicios.common.config.OpenApiConfig;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    @Test
    void exposesMetadataAndJwtBearerScheme() {
        var api = new OpenApiConfig().serviciosOpenApi();
        assertThat(api.getInfo().getTitle()).isEqualTo("API de Gestión de Servicios Universitarios");
        assertThat(api.getInfo().getDescription()).isNotBlank();
        assertThat(api.getInfo().getVersion()).isEqualTo("v1");
        var scheme = api.getComponents().getSecuritySchemes().get("bearerAuth");
        assertThat(scheme.getType()).isEqualTo(SecurityScheme.Type.HTTP);
        assertThat(scheme.getScheme()).isEqualTo("bearer");
        assertThat(scheme.getBearerFormat()).isEqualTo("JWT");
        // Los requisitos de seguridad se declaran por operación, no en endpoints públicos.
        assertThat(api.getSecurity()).isNullOrEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"dev", "test"})
    void enablesDocumentationInDevelopmentAndTest(String profile) {
        context(profile).run(ctx -> {
            assertThat(ctx.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isTrue();
            assertThat(ctx.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isTrue();
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"dev", "test"})
    void allowsDisablingDocumentationWithEnvironmentVariable(String profile) {
        context(profile).withPropertyValues("SWAGGER_ENABLED=false").run(ctx -> {
            assertThat(ctx.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
            assertThat(ctx.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"default", "prod"})
    void disablesDocumentationByDefault(String profile) {
        context(profile).run(ctx -> {
            assertThat(ctx.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
            assertThat(ctx.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
        });
    }

    @Test
    void productionCannotBeEnabledWithSwaggerEnvironmentVariable() {
        context("prod").withPropertyValues("SWAGGER_ENABLED=true").run(ctx -> {
            assertThat(ctx.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
            assertThat(ctx.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
        });
    }

    private ApplicationContextRunner context(String profile) {
        return new ApplicationContextRunner()
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withPropertyValues("spring.profiles.active=" + profile);
    }
}
