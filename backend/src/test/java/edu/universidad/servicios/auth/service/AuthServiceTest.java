package edu.universidad.servicios.auth.service;

import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.dto.RegistroRequest;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.common.exception.RecursoEnConflictoException;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private Usuario estudiante;

    @BeforeEach
    void setUp() {
        estudiante = UsuarioTestBuilder.unUsuario().comoEstudiante()
                .conCorreo("estudiante@universidad.edu")
                .build();
    }

    private RegistroRequest crearRegistroRequest(String codigo, String correo) {
        RegistroRequest req = new RegistroRequest();
        req.setCodigoInstitucional(codigo);
        req.setNombre("Juan");
        req.setApellido("Perez");
        req.setCorreo(correo);
        req.setPassword("Password123");
        return req;
    }

    @Test
    @DisplayName("Login exitoso devuelve token y datos del usuario")
    void loginExitoso() {
        LoginRequest request = new LoginRequest("estudiante@universidad.edu", "Password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));
        when(usuarioRepository.findByCorreo("estudiante@universidad.edu")).thenReturn(Optional.of(estudiante));
        when(jwtService.generateToken(estudiante)).thenReturn("jwt.token.mock");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt.token.mock", response.getToken());
        assertEquals("Bearer", response.getTipo());
        assertEquals("estudiante@universidad.edu", response.getCorreo());
        assertEquals("ESTUDIANTE", response.getRol());
        verify(usuarioRepository).save(estudiante);
    }

    @Test
    @DisplayName("Login con credenciales incorrectas propaga BadCredentialsException")
    void loginCredencialesIncorrectas() {
        LoginRequest request = new LoginRequest("estudiante@universidad.edu", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Credenciales incorrectas"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(usuarioRepository, never()).findByCorreo(anyString());
    }

    @Test
    @DisplayName("Registro exitoso crea usuario con rol estudiante y devuelve token")
    void registroExitoso() {
        RegistroRequest request = crearRegistroRequest("20230001", "juan.perez@universidad.edu");

        Rol rolEstudiante = new Rol();
        rolEstudiante.setId(4);
        rolEstudiante.setNombre("ROLE_ESTUDIANTE");

        when(usuarioRepository.existsByCorreo("juan.perez@universidad.edu")).thenReturn(false);
        when(usuarioRepository.existsByCodigoInstitucional("20230001")).thenReturn(false);
        when(rolRepository.findByNombre("ROLE_ESTUDIANTE")).thenReturn(Optional.of(rolEstudiante));
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPassword");
        when(jwtService.generateToken(any(Usuario.class))).thenReturn("jwt.token.nuevo");

        AuthResponse response = authService.registrar(request);

        assertNotNull(response);
        assertEquals("jwt.token.nuevo", response.getToken());
        assertEquals("juan.perez@universidad.edu", response.getCorreo());
        assertEquals("ROLE_ESTUDIANTE", response.getRol());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Registro con correo existente lanza RecursoEnConflictoException")
    void registroCorreoDuplicado() {
        RegistroRequest request = crearRegistroRequest("20230001", "duplicado@universidad.edu");

        when(usuarioRepository.existsByCorreo("duplicado@universidad.edu")).thenReturn(true);

        assertThrows(RecursoEnConflictoException.class, () -> authService.registrar(request));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Registro con código institucional existente lanza RecursoEnConflictoException")
    void registroCodigoDuplicado() {
        RegistroRequest request = crearRegistroRequest("20230001", "nuevo@universidad.edu");

        when(usuarioRepository.existsByCorreo("nuevo@universidad.edu")).thenReturn(false);
        when(usuarioRepository.existsByCodigoInstitucional("20230001")).thenReturn(true);

        assertThrows(RecursoEnConflictoException.class, () -> authService.registrar(request));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Registro sin rol en base de datos lanza IllegalStateException")
    void registroSinRolEnBD() {
        RegistroRequest request = crearRegistroRequest("20230001", "juan@universidad.edu");

        when(usuarioRepository.existsByCorreo("juan@universidad.edu")).thenReturn(false);
        when(usuarioRepository.existsByCodigoInstitucional("20230001")).thenReturn(false);
        when(rolRepository.findByNombre("ROLE_ESTUDIANTE")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> authService.registrar(request));
    }
}
