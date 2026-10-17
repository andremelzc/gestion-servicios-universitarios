package edu.universidad.servicios.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.dto.CambiarPasswordRequest;
import edu.universidad.servicios.auth.exception.PasswordActualIncorrectaException;
import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.auth.service.AuthService;
import edu.universidad.servicios.common.exception.GlobalExceptionHandler;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CambiarPasswordControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Usuario usuario;
    private UsuarioDetails usuarioDetails;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        Rol rol = new Rol();
        rol.setId(1);
        rol.setNombre("ROLE_ESTUDIANTE");

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setCorreo("estudiante@universidad.edu");
        usuario.setNombre("Estudiante");
        usuario.setApellido("Prueba");
        usuario.setPasswordHash("$2a$12$hashedPasswordActual");
        usuario.setRol(rol);
        usuario.setActivo(true);

        usuarioDetails = new UsuarioDetails(usuario);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(usuarioDetails, null, usuarioDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password con credenciales válidas retorna 204 No Content")
    void cambiarPasswordExitoso() throws Exception {
        String json = """
                {
                    "passwordActual": "PasswordActual123",
                    "nuevaPassword": "NuevaPasswordSegura456"
                }
                """;

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNoContent());

        verify(authService).cambiarPassword(eq("estudiante@universidad.edu"), any(CambiarPasswordRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password acepta alias 'passwordNueva' y retorna 204")
    void cambiarPasswordConAliasPasswordNueva() throws Exception {
        String json = """
                {
                    "passwordActual": "PasswordActual123",
                    "passwordNueva": "NuevaPasswordSegura456"
                }
                """;

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNoContent());

        verify(authService).cambiarPassword(eq("estudiante@universidad.edu"), any(CambiarPasswordRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password con passwordActual incorrecta retorna 400 Bad Request")
    void cambiarPasswordActualIncorrecta() throws Exception {
        String json = """
                {
                    "passwordActual": "PasswordErrada123",
                    "nuevaPassword": "NuevaPasswordSegura456"
                }
                """;

        doThrow(new PasswordActualIncorrectaException("La contraseña actual es incorrecta"))
                .when(authService).cambiarPassword(eq("estudiante@universidad.edu"), any(CambiarPasswordRequest.class));

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Error de validación"))
                .andExpect(jsonPath("$.errores.passwordActual").value("La contraseña actual es incorrecta"));
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password con nuevaPassword que no cumple requisitos retorna 400")
    void cambiarPasswordNuevaInvalida() throws Exception {
        String json = """
                {
                    "passwordActual": "PasswordActual123",
                    "nuevaPassword": "debil"
                }
                """;

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Error de validación"))
                .andExpect(jsonPath("$.errores.nuevaPassword").exists());

        verify(authService, never()).cambiarPassword(anyString(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password con passwordActual en blanco retorna 400")
    void cambiarPasswordActualEnBlanco() throws Exception {
        String json = """
                {
                    "passwordActual": "",
                    "nuevaPassword": "NuevaPasswordSegura456"
                }
                """;

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Error de validación"))
                .andExpect(jsonPath("$.errores.passwordActual").exists());

        verify(authService, never()).cambiarPassword(anyString(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/auth/cambiar-password sin usuario autenticado retorna 401 Unauthorized")
    void cambiarPasswordSinAutenticacion() throws Exception {
        SecurityContextHolder.clearContext();

        String json = """
                {
                    "passwordActual": "PasswordActual123",
                    "nuevaPassword": "NuevaPasswordSegura456"
                }
                """;

        mockMvc.perform(put("/api/v1/auth/cambiar-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).cambiarPassword(anyString(), any());
    }
}
