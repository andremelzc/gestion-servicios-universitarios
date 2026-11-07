package edu.universidad.servicios.solicitud;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.HistorialSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EvidenciaArchivoRepository;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Validación E2E del flujo MVP completo en ambiente integrado contra MySQL 8 (QA-00 / TASK-013 / #81).
 *
 * <p>Ejecuta el guion de extremo a extremo operando con los 4 roles institucionales:
 * Login HTTP → Registrar solicitud multipart → Verificar persistencia en MySQL → Consultar listado y detalle
 * → Asignar técnico (Supervisor) → Iniciar atención (Técnico) → Resolver con informe y evidencia (Técnico)
 * → Cerrar con conformidad (Estudiante) → Verificar historial inmutable y KPIs (Admin).</p>
 */
@TestPropertySource(properties = "spring.flyway.enabled=true")
@Transactional
class FlujoMvpE2EIT extends AbstractIntegrationTest {

    private static final String AREA_TI = "Tecnologías de la Información";
    private static final String CLAVE_E2E = "ClaveSeguraE2E#2026";
    private static final byte[] JPEG_VALIDO = {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
    };

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private AreaRepository areaRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private PrioridadRepository prioridadRepository;
    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private HistorialSolicitudRepository historialRepository;
    @Autowired private EvidenciaArchivoRepository evidenciaRepository;

    private Usuario estudiante;
    private Usuario supervisorTi;
    private Usuario tecnicoTi;
    private Usuario admin;
    private Integer idCategoriaTi;
    private Integer idPrioridadAlta;

    @BeforeEach
    void setUp() {
        Area areaTi = areaRepository.findByNombre(AREA_TI).orElseThrow();
        String hash = passwordEncoder.encode(CLAVE_E2E);

        estudiante = crearActor("est.e2e@universidad.edu", "E2E-EST-01", "ROLE_ESTUDIANTE", null, hash);
        supervisorTi = crearActor("sup.ti.e2e@universidad.edu", "E2E-SUP-01", "ROLE_SUPERVISOR", areaTi, hash);
        tecnicoTi = crearActor("tec.ti.e2e@universidad.edu", "E2E-TEC-01", "ROLE_TECNICO", areaTi, hash);
        admin = crearActor("admin.e2e@universidad.edu", "E2E-ADM-01", "ROLE_ADMIN", null, hash);

        Categoria categoriaTi = categoriaRepository.findByAreaIdAndActivoTrueOrderByNombreAsc(areaTi.getId()).getFirst();
        idCategoriaTi = categoriaTi.getId();
        idPrioridadAlta = prioridadRepository.findAll().getFirst().getId();
    }

    private Usuario crearActor(String correo, String codigo, String rol, Area area, String passwordHash) {
        return usuarioRepository.save(UsuarioTestBuilder.unUsuario()
                .conCorreo(correo)
                .conCodigoInstitucional(codigo)
                .conPasswordHash(passwordHash)
                .conRol(rolRepository.findByNombre(rol).orElseThrow())
                .conArea(area)
                .build());
    }

    private String iniciarSesionHttp(String correo, String rolEsperado) throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("correo", correo, "password", CLAVE_E2E));

        String json = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.correo").value(correo))
                .andExpect(jsonPath("$.rol").value(rolEsperado))
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        return "Bearer " + objectMapper.readTree(json).get("token").asText();
    }

    @Test
    @DisplayName("[TASK-013 / QA-00] Flujo E2E completo: Login (4 roles) → Alta → MySQL → Consulta → Asignación → Inicio → Resolución → Cierre")
    void flujoMvpCompletoConCuatroRoles() throws Exception {
        // 1. Login HTTP real con los 4 roles institucionales
        String tokenEstudiante = iniciarSesionHttp(estudiante.getCorreo(), "ROLE_ESTUDIANTE");
        String tokenSupervisor = iniciarSesionHttp(supervisorTi.getCorreo(), "ROLE_SUPERVISOR");
        String tokenTecnico = iniciarSesionHttp(tecnicoTi.getCorreo(), "ROLE_TECNICO");
        String tokenAdmin = iniciarSesionHttp(admin.getCorreo(), "ROLE_ADMIN");

        // 2. Estudiante registra solicitud multipart con evidencia fotográfica
        SolicitudCrearRequest crearReq = new SolicitudCrearRequest(
                "Proyector sin señal en laboratorio B-204",
                "El proyector del laboratorio B-204 parpadea y no detecta la entrada HDMI desde las 08:00.",
                "Campus Central",
                "Pabellón B - Aula 204",
                idCategoriaTi,
                idPrioridadAlta
        );
        MockMultipartFile parteSolicitud = new MockMultipartFile(
                "solicitud", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(crearReq));
        MockMultipartFile evidenciaInicial = new MockMultipartFile(
                "archivos", "proyector-falla.jpg", MediaType.IMAGE_JPEG_VALUE, JPEG_VALIDO);

        String altaResponse = mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(parteSolicitud)
                        .file(evidenciaInicial)
                        .header("Authorization", tokenEstudiante))
                .andExpect(status().isCreated())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.codigo").value(org.hamcrest.Matchers.matchesPattern("^SOL-\\d{4}-\\d{4}$")))
                .andExpect(jsonPath("$.estado").value("REGISTRADA"))
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode nodoCreada = objectMapper.readTree(altaResponse);
        Long solicitudId = nodoCreada.get("id").asLong();
        String codigoSolicitud = nodoCreada.get("codigo").asText();

        // 3. Verificación directa en MySQL 8 (solicitud, historial inicial y evidencia)
        Solicitud persistida = solicitudRepository.findById(solicitudId).orElseThrow();
        assertThat(persistida.getCodigo()).isEqualTo(codigoSolicitud);
        assertThat(persistida.getEstado().getCodigo()).isEqualTo("REGISTRADA");
        assertThat(persistida.getFechaLimiteSla()).isNotNull();

        List<HistorialSolicitud> historialInicial = historialRepository
                .findBySolicitudIdConDetalles(solicitudId);
        assertThat(historialInicial).hasSize(1);
        assertThat(historialInicial.getFirst().getEstadoAnterior()).isNull();
        assertThat(historialInicial.getFirst().getEstadoNuevo().getCodigo()).isEqualTo("REGISTRADA");

        // 4. Estudiante consulta "Mis solicitudes" y el detalle del ticket creado
        mockMvc.perform(get("/api/v1/solicitudes/mis-solicitudes")
                        .header("Authorization", tokenEstudiante))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.codigo == '" + codigoSolicitud + "')]").isNotEmpty());

        mockMvc.perform(get("/api/v1/solicitudes/{id}", solicitudId)
                        .header("Authorization", tokenEstudiante))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(codigoSolicitud))
                .andExpect(jsonPath("$.estadoCodigo").value("REGISTRADA"))
                .andExpect(jsonPath("$.evidencias.length()").value(1));

        // 5. Supervisor TI consulta la bandeja del área y asigna al Técnico TI (ADR-003: atajo con doble historial)
        mockMvc.perform(get("/api/v1/solicitudes")
                        .header("Authorization", tokenSupervisor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == " + solicitudId + ")]").isNotEmpty());

        String asignarBody = objectMapper.writeValueAsString(Map.of(
                "idTecnico", tecnicoTi.getId(),
                "nota", "Asignado a soporte técnico de laboratorio para revisión inmediata"
        ));
        mockMvc.perform(put("/api/v1/solicitudes/{id}/asignar", solicitudId)
                        .header("Authorization", tokenSupervisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asignarBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo").value("ASIGNADA"))
                .andExpect(jsonPath("$.tecnicoId").value(tecnicoTi.getId()));

        // 6. Técnico TI inicia la atención (ASIGNADA -> EN_ATENCION)
        mockMvc.perform(put("/api/v1/solicitudes/{id}/iniciar-atencion", solicitudId)
                        .header("Authorization", tokenTecnico))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo").value("EN_ATENCION"));

        // 7. Técnico TI resuelve la solicitud adjuntando informe y evidencia fotográfica (EN_ATENCION -> RESUELTA)
        MockMultipartFile datosResolucion = new MockMultipartFile(
                "datos", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"informe\":\"Se reemplazó el cable HDMI deteriorado y se recalibró la lámpara del proyector.\"}".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile evidenciaResolucion = new MockMultipartFile(
                "archivos", "proyector-operativo.jpg", MediaType.IMAGE_JPEG_VALUE, JPEG_VALIDO);

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/solicitudes/{id}/resolver", solicitudId)
                        .file(datosResolucion)
                        .file(evidenciaResolucion)
                        .header("Authorization", tokenTecnico))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo").value("RESUELTA"))
                .andExpect(jsonPath("$.informeResolucion").value(
                        "Se reemplazó el cable HDMI deteriorado y se recalibró la lámpara del proyector."))
                .andExpect(jsonPath("$.evidencias.length()").value(2));

        // 8. Estudiante cierra la solicitud con conformidad (RESUELTA -> CERRADA)
        mockMvc.perform(put("/api/v1/solicitudes/{id}/cerrar", solicitudId)
                        .header("Authorization", tokenEstudiante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comentario\":\"El proyector funciona correctamente en clase.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo").value("CERRADA"));

        // 9. Administrador verifica la trazabilidad completa del historial y los KPIs del dashboard
        mockMvc.perform(get("/api/v1/solicitudes/{id}/historial", solicitudId)
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].estadoNuevo").value("REGISTRADA"))
                .andExpect(jsonPath("$[1].estadoNuevo").value("EN_EVALUACION"))
                .andExpect(jsonPath("$[2].estadoNuevo").value("ASIGNADA"))
                .andExpect(jsonPath("$[3].estadoNuevo").value("EN_ATENCION"))
                .andExpect(jsonPath("$[4].estadoNuevo").value("RESUELTA"))
                .andExpect(jsonPath("$[5].estadoNuevo").value("CERRADA"));

        mockMvc.perform(get("/api/v1/dashboard/kpis")
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registradas").isNumber())
                .andExpect(jsonPath("$.atendidas").isNumber());

        assertThat(evidenciaRepository.findAll()
                .stream()
                .filter(e -> e.getSolicitud().getId().equals(solicitudId))
                .count()).isEqualTo(2);
    }
}
