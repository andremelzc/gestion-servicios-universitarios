package edu.universidad.servicios.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    private final org.springframework.core.env.Environment environment;

    /**
     * /actuator/prometheus solo es público en un puerto de gestión distinto al de la
     * aplicación (red interna). Si ambos puertos coinciden (p. ej. en Render, donde se
     * publica un único puerto), no existe puerto de gestión separado y el endpoint
     * exige autenticación para no quedar expuesto a Internet.
     */
    private boolean prometheusSoloEnPuertoDeGestion(jakarta.servlet.http.HttpServletRequest request) {
        Integer gestion = environment.getProperty("local.management.port", Integer.class);
        Integer aplicacion = environment.getProperty("local.server.port", Integer.class);
        return gestion != null && !gestion.equals(aplicacion)
                && request.getLocalPort() == gestion
                && "/actuator/prometheus".equals(request.getRequestURI());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/api/v1/auth/login",
                        "/api/v1/auth/registro",
                        "/api/v1/auth/recuperar-password",
                        "/api/v1/auth/restablecer-password"
                ).permitAll()
                // OBS-07: Actuator vive en el puerto de gestión (MANAGEMENT_PORT, red interna).
                // Solo health es público; prometheus se permite porque ese puerto no se publica.
                // El resto de /actuator exige autenticación.
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers(this::prometheusSoloEnPuertoDeGestion).permitAll()
                // Swagger (se debería limitar en prod)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Reglas RBAC
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/dashboard/**").hasAnyRole("TECNICO", "SUPERVISOR", "ADMIN")
                // Todo lo demás autenticado
                .anyRequest().authenticated()
            )
            // TODO: Agregar manejadores propios de 401 y 403 (RFC 7807)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        if (allowedOrigins.equals("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
