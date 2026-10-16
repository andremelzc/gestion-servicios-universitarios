package edu.universidad.servicios.solicitud;

import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudCreadaResponse;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.solicitud.service.FileStorageService;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doCallRealMethod;
import static org.mockito.Mockito.doThrow;

/**
 * Pruebas de integración para el alta de solicitudes (REG-21 / Issue #77 / TC-007, TC-008, TC-013).
 * Valida la persistencia en base de datos real (Testcontainers MySQL) y la atomicidad transaccional con rollback de evidencias.
 */
@TestPropertySource(properties = "spring.flyway.enabled=true")
class AltaTransaccionalIT extends AbstractIntegrationTest {

    @Autowired
    private SolicitudService solicitudService;

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private EvidenciaArchivoRepository evidenciaRepository;

    @Autowired
    private HistorialSolicitudRepository historialRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private PrioridadRepository prioridadRepository;

    @MockitoSpyBean
    private FileStorageService fileStorageService;

    private Usuario solicitante;
    private Categoria categoria;
    private Prioridad prioridad;

    private static final byte[] JPEG_BYTES = new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
    };

    @BeforeEach
    void setUp() {
        Mockito.reset(fileStorageService);

        Rol rolEstudiante = rolRepository.findByNombre("ROLE_ESTUDIANTE").orElseThrow();
        solicitante = usuarioRepository.findByCorreo("estudiante.alta.it@universidad.edu")
                .orElseGet(() -> usuarioRepository.save(
                        UsuarioTestBuilder.unUsuario()
                                .conCorreo("estudiante.alta.it@universidad.edu")
                                .conCodigoInstitucional("EST-ALTA-01")
                                .conRol(rolEstudiante)
                                .build()
                ));

        categoria = categoriaRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getActivo()))
                .findFirst()
                .orElseThrow();

        prioridad = prioridadRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActivo()))
                .findFirst()
                .orElseThrow();
    }

    @Test
    @DisplayName("[US-05, US-07][TC-007] Alta exitosa persiste solicitud, evidencia e historial inicial en MySQL real")
    void altaExitosaPersisteEnBaseDeDatosReal() {
        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Falla en proyector pabellón A",
                "El proyector no enciende desde la mañana y parpadea la luz roja",
                "Campus Central",
                "Aula A-204",
                categoria.getId(),
                prioridad.getId()
        );

        MockMultipartFile archivo = new MockMultipartFile(
                "archivos",
                "evidencia_proyector.jpg",
                "image/jpeg",
                JPEG_BYTES
        );

        SolicitudCreadaResponse response = solicitudService.crear(request, List.of(archivo), solicitante);

        assertThat(response).isNotNull();
        assertThat(response.id()).isNotNull();
        assertThat(response.codigo()).matches("^SOL-\\d{4}-\\d{4}$");
        assertThat(response.estado()).isEqualTo("REGISTRADA");
        assertThat(response.fechaRegistro()).isNotNull();
        assertThat(response.fechaLimiteSla()).isNotNull();

        // 1. Verificación de entidad Solicitud en base de datos real
        Solicitud solicitudGuardada = solicitudRepository.findById(response.id()).orElse(null);
        assertThat(solicitudGuardada).isNotNull();
        assertThat(solicitudGuardada.getCodigo()).isEqualTo(response.codigo());
        assertThat(solicitudGuardada.getTitulo()).isEqualTo("Falla en proyector pabellón A");
        assertThat(solicitudGuardada.getEstado().getCodigo()).isEqualTo("REGISTRADA");
        assertThat(solicitudGuardada.getSolicitante().getId()).isEqualTo(solicitante.getId());

        // 2. Verificación de entidad EvidenciaArchivo en base de datos real
        List<EvidenciaArchivo> evidencias = evidenciaRepository.findAll().stream()
                .filter(e -> e.getSolicitud().getId().equals(response.id()))
                .toList();
        assertThat(evidencias).hasSize(1);
        EvidenciaArchivo evidencia = evidencias.getFirst();
        assertThat(evidencia.getTipoEvidencia()).isEqualTo(TipoEvidencia.INICIAL);
        assertThat(evidencia.getNombreOriginal()).isEqualTo("evidencia_proyector.jpg");
        assertThat(evidencia.getMimeType()).isEqualTo("image/jpeg");
        assertThat(evidencia.getNombreAlmacenado()).isNotBlank();

        // 3. Verificación de HistorialSolicitud (estado NULL -> REGISTRADA)
        List<HistorialSolicitud> historial = historialRepository.findBySolicitudIdConDetalles(response.id());
        assertThat(historial).hasSize(1);
        assertThat(historial.getFirst().getEstadoAnterior()).isNull();
        assertThat(historial.getFirst().getEstadoNuevo().getCodigo()).isEqualTo("REGISTRADA");
        assertThat(historial.getFirst().getUsuario().getId()).isEqualTo(solicitante.getId());

        // Limpieza de archivo físico generado
        fileStorageService.delete(evidencia.getNombreAlmacenado());
    }

    @Test
    @DisplayName("[US-05][TC-008] Alta rechazada con categoría inactiva o inexistente no modifica base de datos")
    void altaRechazadaNoModificaBaseDeDatos() {
        long conteoSolicitudesInicial = solicitudRepository.count();
        long conteoEvidenciasInicial = evidenciaRepository.count();
        long conteoHistorialInicial = historialRepository.count();

        SolicitudCrearRequest requestInvalido = new SolicitudCrearRequest(
                "Solicitud con categoría inexistente",
                "Descripción válida para prueba de rechazo de categoría",
                "Campus Central",
                "Laboratorio 1",
                999999, // categoría inexistente
                prioridad.getId()
        );

        assertThatThrownBy(() -> solicitudService.crear(requestInvalido, List.of(), solicitante))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("categoría no existe");

        assertThat(solicitudRepository.count()).isEqualTo(conteoSolicitudesInicial);
        assertThat(evidenciaRepository.count()).isEqualTo(conteoEvidenciasInicial);
        assertThat(historialRepository.count()).isEqualTo(conteoHistorialInicial);
    }

    @Test
    @DisplayName("[RNF-04, CA-15][TC-013] Fallo al guardar archivo a mitad de alta realiza rollback total en BD y elimina evidencias huérfanas")
    void falloAlGuardarArchivoAMitadDeAltaRealizaRollbackTotal() {
        long conteoSolicitudesInicial = solicitudRepository.count();
        long conteoEvidenciasInicial = evidenciaRepository.count();
        long conteoHistorialInicial = historialRepository.count();

        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Falla para probar rollback transaccional",
                "Esta solicitud debe ser revertida completamente en MySQL si falla el guardado",
                "Campus Norte",
                "Pabellón B",
                categoria.getId(),
                prioridad.getId()
        );

        MockMultipartFile archivo1 = new MockMultipartFile(
                "archivos",
                "primer_archivo.jpg",
                "image/jpeg",
                JPEG_BYTES
        );

        MockMultipartFile archivo2 = new MockMultipartFile(
                "archivos",
                "segundo_archivo.jpg",
                "image/jpeg",
                JPEG_BYTES
        );

        // Simulamos que el primer archivo se guarda correctamente, pero el segundo falla por error de E/S
        doCallRealMethod()
                .doThrow(new IllegalStateException("Fallo de E/S simulado al guardar segundo archivo"))
                .when(fileStorageService).store(any());

        assertThatThrownBy(() -> solicitudService.crear(request, List.of(archivo1, archivo2), solicitante))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Fallo de E/S simulado");

        // 1. Verificación de rollback en base de datos real: 0 filas nuevas en MySQL
        assertThat(solicitudRepository.count())
                .as("No debe quedar solicitud huérfana en la base de datos tras rollback")
                .isEqualTo(conteoSolicitudesInicial);

        assertThat(evidenciaRepository.count())
                .as("No deben quedar registros de evidencia tras rollback")
                .isEqualTo(conteoEvidenciasInicial);

        assertThat(historialRepository.count())
                .as("No deben quedar registros de historial tras rollback")
                .isEqualTo(conteoHistorialInicial);
    }
}
