package edu.universidad.servicios.auth.security;

import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private static final String TEST_SECRET = "supersecretkeywithmorethan32byteslength!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKeyString", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMinutes", 60L);
        jwtService.init();
    }

    @Test
    @DisplayName("Debe generar token JWT válido y extraer el username")
    void debeGenerarYExtraerUsername() {
        Usuario usuario = UsuarioTestBuilder.unUsuario().comoEstudiante()
                .conCorreo("estudiante@universidad.edu")
                .build();

        String token = jwtService.generateToken(usuario);

        assertNotNull(token);
        assertFalse(token.isBlank());
        assertEquals("estudiante@universidad.edu", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Debe validar exitosamente token para el UsuarioDetails correspondiente")
    void debeValidarTokenCorrecto() {
        Usuario usuario = UsuarioTestBuilder.unUsuario().comoEstudiante()
                .conCorreo("valido@universidad.edu")
                .build();

        String token = jwtService.generateToken(usuario);
        UsuarioDetails userDetails = new UsuarioDetails(usuario);

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    @DisplayName("Debe rechazar token si el username no coincide")
    void debeRechazarTokenConUsernameDiferente() {
        Usuario usuario = UsuarioTestBuilder.unUsuario().comoEstudiante()
                .conCorreo("usuario1@universidad.edu")
                .build();
        Usuario otroUsuario = UsuarioTestBuilder.unUsuario().comoEstudiante()
                .conCorreo("usuario2@universidad.edu")
                .build();

        String token = jwtService.generateToken(usuario);
        UsuarioDetails otroUserDetails = new UsuarioDetails(otroUsuario);

        assertFalse(jwtService.isTokenValid(token, otroUserDetails));
    }

    @Test
    @DisplayName("Debe lanzar excepción al inicializar con clave menor a 32 bytes")
    void debeFallarConClaveCorta() {
        JwtService invalidService = new JwtService();
        ReflectionTestUtils.setField(invalidService, "secretKeyString", "clave-corta");
        assertThrows(IllegalArgumentException.class, invalidService::init);
    }
}
