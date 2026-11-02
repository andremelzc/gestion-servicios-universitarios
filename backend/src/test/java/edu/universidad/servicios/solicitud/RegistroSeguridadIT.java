package edu.universidad.servicios.solicitud;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.solicitud.domain.EvidenciaArchivo;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EvidenciaArchivoRepository;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de seguridad del alta de solicitudes (REG-22 / #78): TC-009 (.exe renombrado),
 * TC-010 (archivo &gt; 5 MB), TC-011 (HTML en descripción) y TC-023 (IDOR), por HTTP contra MySQL real.
 * Cada rechazo debe dejar la BD y el almacenamiento de evidencias intactos.
 */
@TestPropertySource(properties = "spring.flyway.enabled=true")
@Transactional
class RegistroSeguridadIT extends AbstractIntegrationTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01};

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private PrioridadRepository prioridadRepository;
    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private EvidenciaArchivoRepository evidenciaRepository;
    @Autowired private HistorialSolicitudRepository historialRepository;
    @Autowired private SolicitudService solicitudService;

    @Value("${app.storage.path}")
    private Path storagePath;

    private Usuario estudianteA;
    private Usuario estudianteB;
    private Integer idCategoria;
    private Integer idPrioridad;

    @BeforeEach
    void setUp() {
        estudianteA = crearEstudiante("a");
        estudianteB = crearEstudiante("b");
        idCategoria = categoriaRepository.findByActivoTrueOrderByNombreAsc().getFirst().getId();
        idPrioridad = prioridadRepository.findAll().getFirst().getId();
    }

    private Usuario crearEstudiante(String sufijo) {
        return usuarioRepository.save(UsuarioTestBuilder.unUsuario()
                .conCorreo("estudiante." + sufijo + ".registro.it@universidad.edu")
                .conCodigoInstitucional("REG-SEC-" + sufijo.toUpperCase())
                .conRol(rolRepository.findByNombre("ROLE_ESTUDIANTE").orElseThrow())
                .build());
    }

    private SolicitudCrearRequest solicitud(String descripcion) {
        return new SolicitudCrearRequest("Proyector sin imagen", descripcion,
                "Campus Central", "Aula A-101", idCategoria, idPrioridad);
    }

    /** Envía el alta como estudiante A y verifica que no quede ninguna fila ni archivo nuevo. */
    private ResultActions altaRechazada(String descripcion, MockMultipartFile archivo) throws Exception {
        long solicitudes = solicitudRepository.count();
        long evidencias = evidenciaRepository.count();
        long historial = historialRepository.count();
        long archivos = contarArchivos();

        var peticion = multipart("/api/v1/solicitudes")
                .file(new MockMultipartFile("solicitud", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(solicitud(descripcion))))
                .header("Authorization", "Bearer " + jwtService.generateToken(estudianteA));
        if (archivo != null) {
            peticion.file(archivo);
        }
        ResultActions resultado = mockMvc.perform(peticion);

        assertThat(solicitudRepository.count()).isEqualTo(solicitudes);
        assertThat(evidenciaRepository.count()).isEqualTo(evidencias);
        assertThat(historialRepository.count()).isEqualTo(historial);
        assertThat(contarArchivos()).isEqualTo(archivos);
        return resultado;
    }

    private long contarArchivos() throws IOException {
        if (!Files.isDirectory(storagePath)) {
            return 0;
        }
        try (Stream<Path> archivos = Files.walk(storagePath)) {
            return archivos.filter(Files::isRegularFile).count();
        }
    }

    @ParameterizedTest(name = "[TC-011] descripción con {0} → 400")
    @ValueSource(strings = {
            "<script>alert(1)</script> el proyector no enciende",
            "El proyector <img src=x onerror=alert(1)> no enciende"
    })
    void htmlEnDescripcionSeRechaza(String descripcion) throws Exception {
        altaRechazada(descripcion, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.descripcion").exists());
    }

    @Test
    @DisplayName("[TC-009] Ejecutable renombrado a .jpg → 415 sin fila ni archivo")
    void exeRenombradoSeRechaza() throws Exception {
        byte[] exe = {'M', 'Z', (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00};
        altaRechazada("El proyector no enciende desde la mañana",
                new MockMultipartFile("archivos", "foto.jpg", MediaType.IMAGE_JPEG_VALUE, exe))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @DisplayName("[TC-010] Archivo de 6 MB → 413 sin fila ni archivo")
    void archivoMayorA5MbSeRechaza() throws Exception {
        byte[] seisMb = new byte[6 * 1024 * 1024];
        System.arraycopy(JPEG, 0, seisMb, 0, JPEG.length);
        altaRechazada("El proyector no enciende desde la mañana",
                new MockMultipartFile("archivos", "foto.jpg", MediaType.IMAGE_JPEG_VALUE, seisMb))
                .andExpect(status().isContentTooLarge());
    }

    @Test
    @DisplayName("[TC-023] Estudiante B no ve la solicitud, historial ni evidencia de A (IDOR → 404)")
    void idorEntreEstudiantesDevuelve404() throws Exception {
        Long id = solicitudService.crear(solicitud("El proyector no enciende desde la mañana"),
                List.of(new MockMultipartFile("archivos", "foto.jpg", MediaType.IMAGE_JPEG_VALUE, JPEG)),
                estudianteA).id();
        Long idEvidencia = evidenciaRepository.findAll().stream()
                .filter(e -> e.getSolicitud().getId().equals(id))
                .map(EvidenciaArchivo::getId).findFirst().orElseThrow();
        String tokenB = "Bearer " + jwtService.generateToken(estudianteB);
        String base = "/api/v1/solicitudes/" + id;

        for (String ruta : List.of(base, base + "/historial", base + "/evidencias/" + idEvidencia)) {
            mockMvc.perform(get(ruta).header("Authorization", tokenB))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
        mockMvc.perform(get("/api/v1/solicitudes/mis-solicitudes").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == " + id + ")]").isEmpty());
        // Control positivo: el dueño sí la ve
        mockMvc.perform(get(base).header("Authorization", "Bearer " + jwtService.generateToken(estudianteA)))
                .andExpect(status().isOk());
    }
}
