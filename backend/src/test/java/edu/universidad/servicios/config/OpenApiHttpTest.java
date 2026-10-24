package edu.universidad.servicios.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import edu.universidad.servicios.auth.security.JwtAuthenticationFilter;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.auth.security.SecurityConfig;
import edu.universidad.servicios.common.config.OpenApiConfig;
import edu.universidad.servicios.dashboard.controller.DashboardController;
import edu.universidad.servicios.dashboard.service.DashboardService;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springdoc.core.configuration.SpringDocConfiguration;
import org.springdoc.webmvc.core.configuration.SpringDocWebMvcConfiguration;
import org.springdoc.webmvc.ui.SwaggerConfig;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.boot.webmvc.autoconfigure.WebMvcAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OpenApiHttpTest {

    @ParameterizedTest
    @ValueSource(strings = { "dev", "test" })
    void exposesDocumentationAnonymouslyAndDocumentsProtectedOperation(
        String profile
    ) {
        context(profile).run(ctx -> {
            assertThat(ctx).hasNotFailed();
            MockMvc mvc = MockMvcBuilders.webAppContextSetup(ctx)
                .apply(springSecurity())
                .build();

            mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(
                    content().contentTypeCompatibleWith("application/json")
                )
                .andExpect(
                    jsonPath("$.info.title").value(
                        "API de Gestión de Servicios Universitarios"
                    )
                )
                .andExpect(
                    jsonPath("$.info.description", not(emptyOrNullString()))
                )
                .andExpect(jsonPath("$.info.version").value("v1"))
                .andExpect(
                    jsonPath(
                        "$.components.securitySchemes.bearerAuth.type"
                    ).value("http")
                )
                .andExpect(
                    jsonPath(
                        "$.components.securitySchemes.bearerAuth.scheme"
                    ).value("bearer")
                )
                .andExpect(
                    jsonPath(
                        "$.components.securitySchemes.bearerAuth.bearerFormat"
                    ).value("JWT")
                )
                .andExpect(jsonPath("$.security").doesNotExist())
                .andExpect(
                    jsonPath(
                        "$.paths['/api/v1/dashboard/kpis'].get.summary"
                    ).value(
                        "Obtener indicadores de solicitudes y tiempo promedio de atención"
                    )
                )
                .andExpect(
                    jsonPath(
                        "$.paths['/api/v1/dashboard/kpis'].get.security[*].bearerAuth",
                        hasItem(java.util.List.of())
                    )
                );

            mvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/swagger-ui/index.html"));
            mvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("swagger-ui")));
            mvc.perform(get("/swagger-ui/swagger-ui.css"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(".swagger-ui")));
            mvc.perform(get("/v3/api-docs/swagger-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("/v3/api-docs"));

            // La documentación es pública, pero la operación documentada sigue protegida.
            mvc.perform(get("/api/v1/dashboard/kpis")).andExpect(
                status().isForbidden()
            );
            verifyNoInteractions(
                ctx.getBean(DashboardService.class),
                ctx.getBean(UsuarioRepository.class)
            );
        });
    }

    @ParameterizedTest
    @ValueSource(strings = { "dev", "test" })
    void signedJwtAuthenticatesProtectedOperation(String profile) {
        context(profile).run(ctx -> {
            assertThat(ctx).hasNotFailed();
            MockMvc mvc = MockMvcBuilders.webAppContextSetup(ctx)
                .apply(springSecurity())
                .build();
            var usuario =
                edu.universidad.servicios.builder.UsuarioTestBuilder.unUsuario()
                    .comoAdmin()
                    .conId(1L)
                    .build();
            var repository = ctx.getBean(UsuarioRepository.class);
            var dashboard = ctx.getBean(DashboardService.class);
            when(repository.findByCorreo(usuario.getCorreo())).thenReturn(
                java.util.Optional.of(usuario)
            );
            when(dashboard.kpis(usuario, null, null, null)).thenReturn(
                new edu.universidad.servicios.dashboard.dto.KpisResponse(
                    null,
                    null,
                    3,
                    1,
                    2,
                    66.67,
                    4.0,
                    0
                )
            );
            String token = ctx.getBean(JwtService.class).generateToken(usuario);

            mvc.perform(
                get("/api/v1/dashboard/kpis").header(
                    "Authorization",
                    "Bearer " + token
                )
            )
                .andExpect(status().isOk())
                .andExpect(
                    content().contentTypeCompatibleWith("application/json")
                )
                .andExpect(jsonPath("$.registradas").value(3))
                .andExpect(jsonPath("$.atendidas").value(2));

            verify(repository).findByCorreo(usuario.getCorreo());
            verify(dashboard).kpis(usuario, null, null, null);
        });
    }

    @ParameterizedTest
    @ValueSource(strings = { "dev", "test" })
    void swaggerEnvironmentFlagDisablesHttpDocumentation(String profile) {
        context(profile)
            .withPropertyValues("SWAGGER_ENABLED=false")
            .run(ctx -> {
                assertThat(ctx).hasNotFailed();
                assertDocumentationNotFound(
                    MockMvcBuilders.webAppContextSetup(ctx)
                        .apply(springSecurity())
                        .build()
                );
            });
    }

    @ParameterizedTest
    @ValueSource(strings = { "false", "true" })
    void productionNeverExposesHttpDocumentation(String enabled) {
        context("prod")
            .withPropertyValues("SWAGGER_ENABLED=" + enabled)
            .run(ctx -> {
                assertThat(ctx).hasNotFailed();
                assertDocumentationNotFound(
                    MockMvcBuilders.webAppContextSetup(ctx)
                        .apply(springSecurity())
                        .build()
                );
            });
    }

    private void assertDocumentationNotFound(MockMvc mvc) throws Exception {
        for (String path : new String[] {
            "/v3/api-docs",
            "/v3/api-docs/swagger-config",
            "/swagger-ui.html",
            "/swagger-ui/index.html",
            "/swagger-ui/swagger-ui.css",
        }) {
            mvc.perform(get(path)).andExpect(status().isNotFound());
        }
    }

    private WebApplicationContextRunner context(String profile) {
        // Carga los YAML reales, sin escanear la aplicación ni activar persistencia.
        return new WebApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withPropertyValues(
                "spring.profiles.active=" + profile,
                "app.jwt.secret=openapi-http-test-only-secret-at-least-32-bytes",
                "app.jwt.expiration-minutes=5"
            )
            .withConfiguration(
                AutoConfigurations.of(
                    WebMvcAutoConfiguration.class,
                    JacksonAutoConfiguration.class,
                    SpringDocConfiguration.class,
                    SpringDocWebMvcConfiguration.class,
                    SwaggerConfig.class,
                    org.springdoc.core.properties.SpringDocConfigProperties.class,
                    org.springdoc.core.properties.SwaggerUiConfigProperties.class,
                    org.springdoc.core.properties.SwaggerUiOAuthProperties.class,
                    org.springdoc.core.configuration.SpringDocSecurityConfiguration.class,
                    org.springdoc.core.configuration.SpringDocPageableConfiguration.class
                )
            )
            .withUserConfiguration(HttpConfiguration.class)
            .withBean(DashboardService.class, () ->
                mock(DashboardService.class)
            )

            .withBean(UsuarioRepository.class, () ->
                mock(UsuarioRepository.class)
            );
    }

    @Configuration(proxyBeanMethods = false)
    @Import({
        OpenApiConfig.class,
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        DashboardController.class,
    })
    static class HttpConfiguration {}
}
