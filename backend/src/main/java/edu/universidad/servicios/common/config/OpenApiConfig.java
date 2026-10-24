package edu.universidad.servicios.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI serviciosOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Gestión de Servicios Universitarios")
                        .description("API REST para la gestión integral de servicios universitarios. "
                                + "Para probar operaciones protegidas, ingrese el JWT en Authorize.")
                        .version("v1"))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Token JWT obtenido al iniciar sesión; ingrese solo el token, sin el prefijo Bearer.")));
    }
}
