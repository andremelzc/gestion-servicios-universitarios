package edu.universidad.servicios.solicitud;

import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de autorización del módulo Gestión (GES-24 / #122): rol × endpoint × propio/ajeno/otra área.
 * Cubre TC-016 (estudiante asigna → 403 sin cambios), TC-019 (técnico B resuelve la de A → 404)
 * y TC-023 (estudiante A lee la de B → 404) contra la matriz de api-rest.md §4.
 *
 * <p>Cada fila fija el estado de origen correcto de la transición, porque el servicio valida
 * visibilidad (404) → estado (409) → permiso (403); un estado erróneo enmascararía el resultado.</p>
 */
@TestPropertySource(properties = "spring.flyway.enabled=true")
@Transactional
class GestionAutorizacionIT extends AbstractIntegrationTest {

    private static final String AREA_TI = "Tecnologías de la Información";
    private static final String AREA_MANT = "Mantenimiento e Infraestructura";
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01};

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private AreaRepository areaRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private PrioridadRepository prioridadRepository;
    @Autowired private EstadoSolicitudRepository estadoRepository;
    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private HistorialSolicitudRepository historialRepository;
    @Autowired private SolicitudService solicitudService;

    private final Map<String, Usuario> actores = new HashMap<>();
    private Solicitud solicitud;

    @BeforeEach
    void setUp() {
        Area ti = areaRepository.findByNombre(AREA_TI).orElseThrow();
        Area mant = areaRepository.findByNombre(AREA_MANT).orElseThrow();

        crearActor("estA", "ROLE_ESTUDIANTE", null);
        crearActor("estB", "ROLE_ESTUDIANTE", null);
        crearActor("tecTI", "ROLE_TECNICO", ti);
        crearActor("tecTI2", "ROLE_TECNICO", ti);
        crearActor("supTI", "ROLE_SUPERVISOR", ti);
        crearActor("supMant", "ROLE_SUPERVISOR", mant);
        crearActor("admin", "ROLE_ADMIN", null);

        Categoria categoriaTI = categoriaRepository.findByAreaIdAndActivoTrueOrderByNombreAsc(ti.getId()).getFirst();
        Integer idPrioridad = prioridadRepository.findAll().getFirst().getId();
        Long id = solicitudService.crear(new SolicitudCrearRequest(
                "Proyector sin imagen en aula",
                "El proyector del aula no muestra imagen desde la mañana",
                "Campus Central", "Aula A-101", categoriaTI.getId(), idPrioridad
        ), List.of(), actores.get("estA")).id();
        solicitud = solicitudRepository.findById(id).orElseThrow();
    }

    private void crearActor(String clave, String rol, Area area) {
        actores.put(clave, usuarioRepository.save(UsuarioTestBuilder.unUsuario()
                .conCorreo(clave.toLowerCase() + ".gestion.it@universidad.edu")
                .conCodigoInstitucional("GES-" + clave.toUpperCase())
                .conRol(rolRepository.findByNombre(rol).orElseThrow())
                .conArea(area)
                .build()));
    }

    static Stream<Arguments> matriz() {
        return Stream.of(
                // GET detalle / historial (RN-16): ajeno u otra área → 404 para no revelar existencia
                arguments("ver", "ASIGNADA", "estA", 200),
                arguments("ver", "ASIGNADA", "estB", 404),     // TC-023
                arguments("ver", "ASIGNADA", "tecTI", 200),
                arguments("ver", "ASIGNADA", "tecTI2", 404),
                arguments("ver", "ASIGNADA", "supTI", 200),
                arguments("ver", "ASIGNADA", "supMant", 404),
                arguments("ver", "ASIGNADA", "admin", 200),
                arguments("historial", "ASIGNADA", "estA", 200),
                arguments("historial", "ASIGNADA", "estB", 404),
                arguments("historial", "ASIGNADA", "tecTI2", 404),
                arguments("historial", "ASIGNADA", "supMant", 404),
                arguments("historial", "ASIGNADA", "admin", 200),
                // Bandeja y técnicos por rol
                arguments("bandeja", "REGISTRADA", "estA", 403),
                arguments("bandeja", "REGISTRADA", "tecTI", 200),
                arguments("bandeja", "REGISTRADA", "supTI", 200),
                arguments("bandeja", "REGISTRADA", "admin", 200),
                arguments("tecnicos", "REGISTRADA", "estA", 403),
                arguments("tecnicos", "REGISTRADA", "tecTI", 403),
                arguments("tecnicos", "REGISTRADA", "supTI", 200),
                arguments("tecnicos", "REGISTRADA", "admin", 200),
                // Evaluar / asignar: supervisor de su área o admin
                arguments("evaluar", "REGISTRADA", "estA", 403),
                arguments("evaluar", "REGISTRADA", "tecTI", 403),
                arguments("evaluar", "REGISTRADA", "supMant", 404),
                arguments("evaluar", "REGISTRADA", "supTI", 200),
                arguments("evaluar", "REGISTRADA", "admin", 200),
                arguments("asignar", "REGISTRADA", "estA", 403),   // TC-016 (aun siendo el solicitante)
                arguments("asignar", "REGISTRADA", "estB", 403),   // TC-016
                arguments("asignar", "REGISTRADA", "tecTI", 403),
                arguments("asignar", "REGISTRADA", "supMant", 404),
                arguments("asignar", "REGISTRADA", "supTI", 200),
                arguments("asignar", "REGISTRADA", "admin", 200),
                // Iniciar atención / resolver: técnico asignado o admin
                arguments("iniciar", "ASIGNADA", "estA", 403),
                arguments("iniciar", "ASIGNADA", "supTI", 403),
                arguments("iniciar", "ASIGNADA", "tecTI2", 404),
                arguments("iniciar", "ASIGNADA", "tecTI", 200),
                arguments("iniciar", "ASIGNADA", "admin", 200),
                arguments("resolver", "EN_ATENCION", "estA", 403),
                arguments("resolver", "EN_ATENCION", "supTI", 403),
                arguments("resolver", "EN_ATENCION", "tecTI2", 404), // TC-019
                arguments("resolver", "EN_ATENCION", "tecTI", 200),
                arguments("resolver", "EN_ATENCION", "admin", 200),
                // Cerrar: solicitante (por propiedad), supervisor de su área o admin
                arguments("cerrar", "RESUELTA", "estA", 200),
                arguments("cerrar", "RESUELTA", "estB", 404),
                arguments("cerrar", "RESUELTA", "tecTI", 403),
                arguments("cerrar", "RESUELTA", "tecTI2", 404),
                arguments("cerrar", "RESUELTA", "supMant", 404),
                arguments("cerrar", "RESUELTA", "supTI", 200),
                arguments("cerrar", "RESUELTA", "admin", 200)
        );
    }

    @ParameterizedTest(name = "[{index}] {2} {0} sobre solicitud {1} → {3}")
    @MethodSource("matriz")
    void matrizDeAutorizacion(String accion, String estado, String actor, int esperado) throws Exception {
        prepararEstado(estado);
        long historialAntes = historialRepository.count();

        var resultado = mockMvc.perform(peticion(accion)
                        .header("Authorization", "Bearer " + jwtService.generateToken(actores.get(actor))))
                .andExpect(status().is(esperado));

        if (esperado >= 400) {
            // RFC 7807 y BD sin cambios (TC-016)
            resultado.andExpect(jsonPath("$.status").value(esperado));
            assertThat(solicitudRepository.findById(solicitud.getId()).orElseThrow().getEstado().getCodigo())
                    .isEqualTo(estado);
            assertThat(historialRepository.count()).isEqualTo(historialAntes);
        }
    }

    private void prepararEstado(String estado) {
        solicitud.setEstado(estadoRepository.findById(estado).orElseThrow());
        solicitud.setTecnicoAsignado("REGISTRADA".equals(estado) ? null : actores.get("tecTI"));
        solicitud = solicitudRepository.saveAndFlush(solicitud);
    }

    private AbstractMockHttpServletRequestBuilder<?> peticion(String accion) {
        String base = "/api/v1/solicitudes/" + solicitud.getId();
        return switch (accion) {
            case "ver" -> get(base);
            case "historial" -> get(base + "/historial");
            case "bandeja" -> get("/api/v1/solicitudes");
            case "tecnicos" -> get("/api/v1/usuarios/tecnicos");
            case "evaluar" -> put(base + "/evaluar").contentType(MediaType.APPLICATION_JSON).content("{}");
            case "asignar" -> put(base + "/asignar").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"idTecnico\":" + actores.get("tecTI").getId() + "}");
            case "iniciar" -> put(base + "/iniciar-atencion");
            case "resolver" -> multipart(HttpMethod.PUT, base + "/resolver")
                    .file(new MockMultipartFile("datos", "", MediaType.APPLICATION_JSON_VALUE,
                            "{\"informe\":\"Se reemplazó el cable HDMI dañado del aula\"}".getBytes()))
                    .file(new MockMultipartFile("archivos", "evidencia.jpg", MediaType.IMAGE_JPEG_VALUE, JPEG));
            case "cerrar" -> put(base + "/cerrar").contentType(MediaType.APPLICATION_JSON).content("{}");
            default -> throw new IllegalArgumentException(accion);
        };
    }
}
