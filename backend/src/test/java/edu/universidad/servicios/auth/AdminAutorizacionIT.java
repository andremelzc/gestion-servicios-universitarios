package edu.universidad.servicios.auth;

import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Stream;

import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Autorización de administración (ADM-22 / #151, TC-016 parte admin): solo {@code ADMIN} escribe en
 * {@code /api/v1/admin/**}. Los controladores reales de administración aún no existen (#140), así que
 * se ejercita la regla de {@code SecurityConfig} con un controlador de prueba que acepta todos los
 * métodos; cuando #140 se fusione basta con añadir sus rutas reales a la matriz.
 */
@Import(AdminAutorizacionIT.EndpointsAdminDePrueba.class)
@TestPropertySource(properties = "spring.flyway.enabled=true")
@Transactional
class AdminAutorizacionIT extends AbstractIntegrationTest {

    private static final String RUTA = "/api/v1/admin/qa-autorizacion";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;

    @TestConfiguration
    static class EndpointsAdminDePrueba {
        @RestController
        @RequestMapping(RUTA)
        static class AdminDePruebaController {
            @GetMapping public String leer() { return "OK"; }
            @PostMapping public String crear() { return "OK"; }
            @PutMapping("/{id}") public String editar() { return "OK"; }
            @PatchMapping("/{id}") public String parchear() { return "OK"; }
            @DeleteMapping("/{id}") public String eliminar() { return "OK"; }
        }
    }

    static Stream<Arguments> matriz() {
        Stream.Builder<Arguments> casos = Stream.builder();
        for (String metodo : new String[]{"GET", "POST", "PUT", "PATCH", "DELETE"}) {
            for (String rol : new String[]{"ROLE_ESTUDIANTE", "ROLE_TECNICO", "ROLE_SUPERVISOR"}) {
                casos.add(arguments(metodo, rol, 403));
            }
            casos.add(arguments(metodo, "ROLE_ADMIN", 200));
        }
        return casos.build();
    }

    @ParameterizedTest(name = "[{index}] {1} {0} /admin/** → {2}")
    @MethodSource("matriz")
    void soloAdminAccedeAAdministracion(String metodo, String rol, int esperado) throws Exception {
        Usuario actor = usuarioRepository.save(UsuarioTestBuilder.unUsuario()
                .conCorreo("actor.admin.it@universidad.edu")
                .conCodigoInstitucional("ADM-IT-01")
                .conRol(rolRepository.findByNombre(rol).orElseThrow())
                .build());
        String ruta = "GET".equals(metodo) || "POST".equals(metodo) ? RUTA : RUTA + "/1";

        // ponytail: la denegación de /admin/** ocurre en la cadena de filtros y hoy no lleva cuerpo
        // RFC 7807 (TODO en SecurityConfig); se afirma solo el estado.
        mockMvc.perform(request(HttpMethod.valueOf(metodo), ruta)
                        .header("Authorization", "Bearer " + jwtService.generateToken(actor)))
                .andExpect(status().is(esperado));
    }
}
