package edu.universidad.servicios.auth.security;

import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.boot.webmvc.autoconfigure.WebMvcAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CorsConfigTest {

    private static final String TEST_SECRET = "x".repeat(32);

    private WebApplicationContextRunner prodContextWithYaml() {
        return new WebApplicationContextRunner()
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "app.jwt.secret=" + TEST_SECRET
                )
                .withConfiguration(AutoConfigurations.of(WebMvcAutoConfiguration.class))
                .withUserConfiguration(SecurityTestConfiguration.class)
                .withBean(UsuarioRepository.class, () -> mock(UsuarioRepository.class));
    }

    @Test
    @DisplayName("En prod sin ALLOWED_ORIGINS aplica lista vacía, nunca '*' ni localhost")
    void enProdSinAllowedOriginsAplicaListaVaciaYNuncaWildcard() {
        prodContextWithYaml().run(ctx -> {
            assertThat(ctx).hasNotFailed();

            CorsConfigurationSource source = ctx.getBean("corsConfigurationSource", CorsConfigurationSource.class);
            CorsConfiguration config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/auth/login"));

            assertThat(config).isNotNull();
            assertThat(config.getAllowedOrigins()).isEmpty();
            assertThat(config.getAllowedOriginPatterns()).isNullOrEmpty();

            MockMvc mvc = MockMvcBuilders.webAppContextSetup(ctx)
                    .apply(springSecurity())
                    .build();

            mvc.perform(options("/api/v1/auth/login")
                            .header("Origin", "https://evil.example.com")
                            .header("Access-Control-Request-Method", "POST"))
                    .andExpect(status().isForbidden())
                    .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));

            mvc.perform(options("/api/v1/auth/login")
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", "POST"))
                    .andExpect(status().isForbidden())
                    .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        });
    }

    @Test
    @DisplayName("Sin application.yml ni propiedad app.cors.allowed-origins no usa '*' por defecto")
    void sinPropiedadCorsEnSecurityConfigAplicaListaVacia() {
        new WebApplicationContextRunner()
                .withPropertyValues("app.jwt.secret=" + TEST_SECRET)
                .withConfiguration(AutoConfigurations.of(WebMvcAutoConfiguration.class))
                .withUserConfiguration(SecurityTestConfiguration.class)
                .withBean(UsuarioRepository.class, () -> mock(UsuarioRepository.class))
                .run(ctx -> {
                    assertThat(ctx).hasNotFailed();

                    CorsConfigurationSource source = ctx.getBean("corsConfigurationSource", CorsConfigurationSource.class);
                    CorsConfiguration config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/auth/login"));

                    assertThat(config).isNotNull();
                    assertThat(config.getAllowedOrigins()).isEmpty();
                    assertThat(config.getAllowedOriginPatterns()).isNullOrEmpty();
                });
    }

    @Test
    @DisplayName("Falla al arrancar si ALLOWED_ORIGINS contiene '*'")
    void fallaAlArrancarSiAllowedOriginsEsWildcard() {
        prodContextWithYaml()
                .withPropertyValues("ALLOWED_ORIGINS=*")
                .run(ctx -> {
                    assertThat(ctx).hasFailed();
                    assertThat(ctx.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalStateException.class);
                });
    }

    @Test
    @DisplayName("En prod con ALLOWED_ORIGINS explícito permite solo ese origen")
    void enProdConAllowedOriginsExplicitoPermiteSoloEseOrigen() {
        prodContextWithYaml()
                .withPropertyValues("ALLOWED_ORIGINS=https://frontend.universidad.edu")
                .run(ctx -> {
                    assertThat(ctx).hasNotFailed();

                    MockMvc mvc = MockMvcBuilders.webAppContextSetup(ctx)
                            .apply(springSecurity())
                            .build();

                    mvc.perform(options("/api/v1/auth/login")
                                    .header("Origin", "https://frontend.universidad.edu")
                                    .header("Access-Control-Request-Method", "POST"))
                            .andExpect(status().isOk())
                            .andExpect(header().string("Access-Control-Allow-Origin", "https://frontend.universidad.edu"));

                    mvc.perform(options("/api/v1/auth/login")
                                    .header("Origin", "https://evil.example.com")
                                    .header("Access-Control-Request-Method", "POST"))
                            .andExpect(status().isForbidden())
                            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
                });
    }

    @Configuration(proxyBeanMethods = false)
    @Import({
            SecurityConfig.class,
            JwtAuthenticationFilter.class,
            JwtService.class
    })
    static class SecurityTestConfiguration {
    }
}
