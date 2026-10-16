package edu.universidad.servicios.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.dto.RegistroRequest;
import edu.universidad.servicios.auth.service.AuthService;
import edu.universidad.servicios.common.config.JacksonConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new JacksonConfig().objectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/login devuelve 200 y AuthResponse")
    void loginExitoso() throws Exception {
        LoginRequest request = new LoginRequest("usuario@universidad.edu", "Password123");
        AuthResponse response = AuthResponse.builder()
                .token("jwt.mock.token")
                .tipo("Bearer")
                .correo("usuario@universidad.edu")
                .rol("ROLE_ESTUDIANTE")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt.mock.token"))
                .andExpect(jsonPath("$.correo").value("usuario@universidad.edu"))
                .andExpect(jsonPath("$.rol").value("ROLE_ESTUDIANTE"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/registro devuelve 201 y AuthResponse")
    void registroExitoso() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setCodigoInstitucional("20260001");
        request.setNombre("Carlos");
        request.setApellido("Gomez");
        request.setCorreo("carlos.gomez@universidad.edu");
        request.setPassword("PasswordSegura123");

        AuthResponse response = AuthResponse.builder()
                .token("jwt.mock.nuevo")
                .tipo("Bearer")
                .correo("carlos.gomez@universidad.edu")
                .rol("ROLE_ESTUDIANTE")
                .build();

        when(authService.registrar(any(RegistroRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt.mock.nuevo"))
                .andExpect(jsonPath("$.correo").value("carlos.gomez@universidad.edu"));
    }

    @Test
    @DisplayName("[TC-004] Registro con correo externo devuelve 400")
    void registroCorreoFueraDelDominio() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"codigoInstitucional":"20260001","nombre":"Carlos","apellido":"Gomez",
                                 "correo":"carlos@gmail.com","password":"PasswordSegura123"}
                                """))
                .andExpect(status().isBadRequest());

        verify(authService, never()).registrar(any(RegistroRequest.class));
    }

    @Test
    @DisplayName("[TC-005] Registro rechaza un rol enviado por el cliente")
    void registroRechazaRolAdministrativoEnviado() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"codigoInstitucional":"20260001","nombre":"Carlos","apellido":"Gomez",
                                 "correo":"carlos@universidad.edu","password":"PasswordSegura123","rol":"ADMIN"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.rol").value("Campo no permitido en esta petición"));

        verify(authService, never()).registrar(any(RegistroRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/recuperar-password devuelve 501 Not Implemented")
    void recuperarPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-password"))
                .andExpect(status().isNotImplemented());
    }

    @Test
    @DisplayName("POST /api/v1/auth/restablecer-password devuelve 501 Not Implemented")
    void restablecerPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/restablecer-password"))
                .andExpect(status().isNotImplemented());
    }
}
