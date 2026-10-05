package edu.universidad.servicios.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(AuthAuthorizationIT.TestEndpointsConfig.class)
@Transactional
class AuthAuthorizationIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private Usuario adminUser;
    private Usuario supervisorUser;
    private Usuario tecnicoUser;
    private Usuario estudianteUser;
    private Usuario inactivoUser;

    @TestConfiguration
    static class TestEndpointsConfig {
        @RestController
        @RequestMapping("/api/v1/admin/test")
        static class TestAdminController {
            @GetMapping
            public ResponseEntity<String> adminEndpoint() {
                return ResponseEntity.ok("OK_ADMIN");
            }
        }

        @RestController
        @RequestMapping("/api/v1/recurso-protegido")
        static class TestProtectedController {
            @GetMapping
            public ResponseEntity<String> protectedEndpoint() {
                return ResponseEntity.ok("OK_PROTEGIDO");
            }
        }
    }

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();

        Rol rolAdmin = obtenerOCrearRol("ADMIN");
        Rol rolSupervisor = obtenerOCrearRol("SUPERVISOR");
        Rol rolTecnico = obtenerOCrearRol("TECNICO");
        Rol rolEstudiante = obtenerOCrearRol("ESTUDIANTE");

        adminUser = usuarioRepository.save(
                UsuarioTestBuilder.unUsuario()
                        .comoAdmin()
                        .conCorreo("admin.auth@universidad.edu")
                        .conPasswordHash(passwordEncoder.encode("Password123!"))
                        .conRol(rolAdmin)
                        .build()
        );

        supervisorUser = usuarioRepository.save(
                UsuarioTestBuilder.unUsuario()
                        .comoSupervisor()
                        .conCorreo("supervisor.auth@universidad.edu")
                        .conPasswordHash(passwordEncoder.encode("Password123!"))
                        .conRol(rolSupervisor)
                        .build()
        );

        tecnicoUser = usuarioRepository.save(
                UsuarioTestBuilder.unUsuario()
                        .comoTecnico()
                        .conCorreo("tecnico.auth@universidad.edu")
                        .conPasswordHash(passwordEncoder.encode("Password123!"))
                        .conRol(rolTecnico)
                        .build()
        );

        estudianteUser = usuarioRepository.save(
                UsuarioTestBuilder.unUsuario()
                        .comoEstudiante()
                        .conCorreo("estudiante.auth@universidad.edu")
                        .conPasswordHash(passwordEncoder.encode("Password123!"))
                        .conRol(rolEstudiante)
                        .build()
        );

        inactivoUser = usuarioRepository.save(
                UsuarioTestBuilder.unUsuario()
                        .comoEstudiante()
                        .conCodigoInstitucional("INACT-001")
                        .conCorreo("inactivo.auth@universidad.edu")
                        .conPasswordHash(passwordEncoder.encode("Password123!"))
                        .conRol(rolEstudiante)
                        .inactivo()
                        .build()
        );
    }

    private Rol obtenerOCrearRol(String nombre) {
        return rolRepository.findByNombre(nombre).orElseGet(() -> {
            Rol nuevo = new Rol();
            nuevo.setNombre(nombre);
            nuevo.setDescripcion("Rol " + nombre);
            return rolRepository.save(nuevo);
        });
    }

    @Test
    @DisplayName("[TC-001] Login con credenciales válidas retorna 200 y token JWT")
    void testLoginValido() throws Exception {
        LoginRequest request = new LoginRequest("admin.auth@universidad.edu", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.correo").value("admin.auth@universidad.edu"))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    @DisplayName("[TC-002] Login con clave errónea retorna 401 idéntico sin revelar detalles")
    void testLoginPasswordErroneo() throws Exception {
        LoginRequest request = new LoginRequest("admin.auth@universidad.edu", "PasswordIncorrecta!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("[TC-002] Login con correo inexistente retorna 401 idéntico")
    void testLoginCorreoInexistente() throws Exception {
        LoginRequest request = new LoginRequest("noexiste@universidad.edu", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("[TC-006] Recurso protegido sin token rechaza la petición")
    void testRecursoProtegidoSinToken() throws Exception {
        mockMvc.perform(get("/api/v1/recurso-protegido"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("[TC-006] Recurso protegido con token manipulado retorna error 4xx")
    void testRecursoProtegidoTokenManipulado() throws Exception {
        String tokenValido = jwtService.generateToken(estudianteUser);
        String tokenManipulado = tokenValido + "tampered";

        mockMvc.perform(get("/api/v1/recurso-protegido")
                        .header("Authorization", "Bearer " + tokenManipulado))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("[TC-006] Recurso protegido con token expirado retorna error 4xx")
    void testRecursoProtegidoTokenExpirado() throws Exception {
        String tokenExpirado = Jwts.builder()
                .subject(estudianteUser.getCorreo())
                .claim("rol", estudianteUser.getRol().getNombre())
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date(System.currentTimeMillis() - 1000 * 60 * 60))
                .expiration(new Date(System.currentTimeMillis() - 1000 * 60 * 30))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();

        mockMvc.perform(get("/api/v1/recurso-protegido")
                        .header("Authorization", "Bearer " + tokenExpirado))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("[TC-027] Usuario desactivado con token vigente es rechazado en la siguiente petición")
    void testUsuarioDesactivadoRechazado() throws Exception {
        String token = jwtService.generateToken(inactivoUser);

        mockMvc.perform(get("/api/v1/recurso-protegido")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("[TC-027 / RBAC] Endpoint de administración permite acceso a rol ADMIN")
    void testAdminEndpointPermiteAdmin() throws Exception {
        String token = jwtService.generateToken(adminUser);

        mockMvc.perform(get("/api/v1/admin/test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("[TC-027 / RBAC] Endpoint de administración rechaza a rol SUPERVISOR con 403 Forbidden")
    void testAdminEndpointRechazaSupervisor() throws Exception {
        String token = jwtService.generateToken(supervisorUser);

        mockMvc.perform(get("/api/v1/admin/test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("[TC-027 / RBAC] Endpoint de administración rechaza a rol TECNICO con 403 Forbidden")
    void testAdminEndpointRechazaTecnico() throws Exception {
        String token = jwtService.generateToken(tecnicoUser);

        mockMvc.perform(get("/api/v1/admin/test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("[TC-027 / RBAC] Endpoint de administración rechaza a rol ESTUDIANTE con 403 Forbidden")
    void testAdminEndpointRechazaEstudiante() throws Exception {
        String token = jwtService.generateToken(estudianteUser);

        mockMvc.perform(get("/api/v1/admin/test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("[TC-027 / RBAC] Recurso protegido común permite acceso a cualquier rol autenticado")
    void testRecursoProtegidoPermiteCualquierRolAutenticado() throws Exception {
        String tokenEstudiante = jwtService.generateToken(estudianteUser);
        String tokenTecnico = jwtService.generateToken(tecnicoUser);

        mockMvc.perform(get("/api/v1/recurso-protegido")
                        .header("Authorization", "Bearer " + tokenEstudiante))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/recurso-protegido")
                        .header("Authorization", "Bearer " + tokenTecnico))
                .andExpect(status().isOk());
    }
}
