package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.SolicitudAsignarRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudDetalleResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudResolverRequest;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudWorkflowServiceTest {

    @Mock
    private SolicitudRepository solicitudRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EstadoSolicitudRepository estadoRepository;

    @Mock
    private PrioridadRepository prioridadRepository;

    @Mock
    private EvidenciaArchivoRepository evidenciaRepository;

    @Mock
    private HistorialService historialService;

    @Mock
    private AccessPolicy accessPolicy;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private FileTypeValidator fileTypeValidator;

    @Mock
    private SlaCalculator slaCalculator;

    @Spy
    private Clock clock = Clock.fixed(Instant.parse("2026-10-15T10:00:00Z"), ZoneOffset.UTC);

    @InjectMocks
    private SolicitudWorkflowService workflowService;

    private Area areaTI;
    private Area areaMantenimiento;

    private Rol rolSupervisor;
    private Rol rolTecnico;
    private Rol rolEstudiante;

    private Usuario supervisorTI;
    private Usuario tecnicoTI;
    private Usuario tecnicoInactivo;
    private Usuario tecnicoMantenimiento;
    private Usuario estudiante;

    private Categoria categoriaTI;
    private EstadoSolicitud estadoRegistrada;
    private EstadoSolicitud estadoEnEvaluacion;
    private EstadoSolicitud estadoAsignada;
    private EstadoSolicitud estadoEnAtencion;
    private EstadoSolicitud estadoResuelta;

    private Solicitud solicitud;

    @BeforeEach
    void setUp() {
        areaTI = new Area();
        areaTI.setId(1);
        areaTI.setNombre("TI");

        areaMantenimiento = new Area();
        areaMantenimiento.setId(2);
        areaMantenimiento.setNombre("Mantenimiento");

        rolSupervisor = new Rol();
        rolSupervisor.setId(3);
        rolSupervisor.setNombre("ROLE_SUPERVISOR");

        rolTecnico = new Rol();
        rolTecnico.setId(2);
        rolTecnico.setNombre("ROLE_TECNICO");

        rolEstudiante = new Rol();
        rolEstudiante.setId(1);
        rolEstudiante.setNombre("ROLE_ESTUDIANTE");

        supervisorTI = new Usuario();
        supervisorTI.setId(30L);
        supervisorTI.setNombre("Ana");
        supervisorTI.setApellido("Torres");
        supervisorTI.setRol(rolSupervisor);
        supervisorTI.setArea(areaTI);
        supervisorTI.setActivo(true);

        tecnicoTI = new Usuario();
        tecnicoTI.setId(20L);
        tecnicoTI.setNombre("Carlos");
        tecnicoTI.setApellido("Ruiz");
        tecnicoTI.setRol(rolTecnico);
        tecnicoTI.setArea(areaTI);
        tecnicoTI.setActivo(true);

        tecnicoInactivo = new Usuario();
        tecnicoInactivo.setId(21L);
        tecnicoInactivo.setNombre("Pedro");
        tecnicoInactivo.setApellido("Inactivo");
        tecnicoInactivo.setRol(rolTecnico);
        tecnicoInactivo.setArea(areaTI);
        tecnicoInactivo.setActivo(false);

        tecnicoMantenimiento = new Usuario();
        tecnicoMantenimiento.setId(22L);
        tecnicoMantenimiento.setNombre("Lucía");
        tecnicoMantenimiento.setApellido("Mantenimiento");
        tecnicoMantenimiento.setRol(rolTecnico);
        tecnicoMantenimiento.setArea(areaMantenimiento);
        tecnicoMantenimiento.setActivo(true);

        estudiante = new Usuario();
        estudiante.setId(10L);
        estudiante.setNombre("Juan");
        estudiante.setApellido("Pérez");
        estudiante.setRol(rolEstudiante);
        estudiante.setActivo(true);

        categoriaTI = new Categoria();
        categoriaTI.setId(1);
        categoriaTI.setNombre("Redes");
        categoriaTI.setArea(areaTI);

        estadoRegistrada = new EstadoSolicitud();
        estadoRegistrada.setCodigo("REGISTRADA");
        estadoRegistrada.setNombreVisible("Registrada");

        estadoEnEvaluacion = new EstadoSolicitud();
        estadoEnEvaluacion.setCodigo("EN_EVALUACION");
        estadoEnEvaluacion.setNombreVisible("En evaluación");

        estadoAsignada = new EstadoSolicitud();
        estadoAsignada.setCodigo("ASIGNADA");
        estadoAsignada.setNombreVisible("Asignada");

        estadoEnAtencion = new EstadoSolicitud();
        estadoEnAtencion.setCodigo("EN_ATENCION");
        estadoEnAtencion.setNombreVisible("En atención");

        estadoResuelta = new EstadoSolicitud();
        estadoResuelta.setCodigo("RESUELTA");
        estadoResuelta.setNombreVisible("Resuelta");

        solicitud = new Solicitud();
        solicitud.setId(100L);
        solicitud.setCodigo("SOL-2026-0001");
        solicitud.setTitulo("Problema con red");
        solicitud.setSolicitante(estudiante);
        solicitud.setCategoria(categoriaTI);
        solicitud.setEstado(estadoRegistrada);
        solicitud.setFechaRegistro(LocalDateTime.now(clock));
    }

    @Test
    @DisplayName("[CA-1] Asignación desde EN_EVALUACION actualiza técnico, supervisor y registra historial")
    void asignarDesdeEnEvaluacion() {
        solicitud.setEstado(estadoEnEvaluacion);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(supervisorTI), eq(solicitud), eq(Transicion.ASIGNAR))).thenReturn(true);
        when(usuarioRepository.findById(20L)).thenReturn(Optional.of(tecnicoTI));
        when(estadoRepository.findById("ASIGNADA")).thenReturn(Optional.of(estadoAsignada));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Asignado a Carlos");
        SolicitudDetalleResponse detalle = workflowService.asignar(100L, req, supervisorTI);

        assertThat(detalle.estadoCodigo()).isEqualTo("ASIGNADA");
        assertThat(solicitud.getTecnicoAsignado()).isEqualTo(tecnicoTI);
        assertThat(solicitud.getSupervisorAsignador()).isEqualTo(supervisorTI);
        assertThat(solicitud.getFechaAsignacion()).isNotNull();

        verify(historialService).registrar(solicitud, supervisorTI, estadoEnEvaluacion, estadoAsignada, "Asignado a Carlos");
    }

    @Test
    @DisplayName("[CA-2 / ADR-003] Atajo de asignación directa desde REGISTRADA registra dos filas de historial")
    void asignarDirectoDesdeRegistradaRegistraDosFilas() {
        solicitud.setEstado(estadoRegistrada);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(supervisorTI), eq(solicitud), eq(Transicion.ASIGNAR))).thenReturn(true);
        when(usuarioRepository.findById(20L)).thenReturn(Optional.of(tecnicoTI));
        when(estadoRepository.findById("EN_EVALUACION")).thenReturn(Optional.of(estadoEnEvaluacion));
        when(estadoRepository.findById("ASIGNADA")).thenReturn(Optional.of(estadoAsignada));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Asignación directa");
        SolicitudDetalleResponse detalle = workflowService.asignar(100L, req, supervisorTI);

        assertThat(detalle.estadoCodigo()).isEqualTo("ASIGNADA");

        // Verifica que se registren exactamente dos transiciones en historial
        verify(historialService).registrar(solicitud, supervisorTI, estadoRegistrada, estadoEnEvaluacion, null);
        verify(historialService).registrar(solicitud, supervisorTI, estadoEnEvaluacion, estadoAsignada, "Asignación directa");
    }

    @Test
    @DisplayName("[CA-4] Asignar a técnico inactivo lanza IllegalArgumentException")
    void asignarTecnicoInactivoFalla() {
        solicitud.setEstado(estadoEnEvaluacion);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(supervisorTI), eq(solicitud), eq(Transicion.ASIGNAR))).thenReturn(true);
        when(usuarioRepository.findById(21L)).thenReturn(Optional.of(tecnicoInactivo));

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(21L, "Nota");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                workflowService.asignar(100L, req, supervisorTI)
        );

        assertThat(ex.getMessage()).contains("no está activo");
    }

    @Test
    @DisplayName("[CA-4] Asignar a técnico de otra área lanza IllegalArgumentException")
    void asignarTecnicoOtraAreaFalla() {
        solicitud.setEstado(estadoEnEvaluacion);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(supervisorTI), eq(solicitud), eq(Transicion.ASIGNAR))).thenReturn(true);
        when(usuarioRepository.findById(22L)).thenReturn(Optional.of(tecnicoMantenimiento));

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(22L, "Nota");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                workflowService.asignar(100L, req, supervisorTI)
        );

        assertThat(ex.getMessage()).contains("no pertenece al área de la categoría");
    }

    @Test
    @DisplayName("[CA-8] Reasignación desde ASIGNADA registra nota de cambio de técnico")
    void reasignarRegistraNotaFormateada() {
        solicitud.setEstado(estadoAsignada);
        solicitud.setTecnicoAsignado(tecnicoTI);

        Usuario nuevoTecnico = new Usuario();
        nuevoTecnico.setId(25L);
        nuevoTecnico.setNombre("Marcos");
        nuevoTecnico.setApellido("García");
        nuevoTecnico.setRol(rolTecnico);
        nuevoTecnico.setArea(areaTI);
        nuevoTecnico.setActivo(true);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(supervisorTI), eq(solicitud), eq(Transicion.REASIGNAR))).thenReturn(true);
        when(usuarioRepository.findById(25L)).thenReturn(Optional.of(nuevoTecnico));
        when(estadoRepository.findById("ASIGNADA")).thenReturn(Optional.of(estadoAsignada));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(25L, "Reemplazo por turno");
        workflowService.asignar(100L, req, supervisorTI);

        verify(historialService).registrar(eq(solicitud), eq(supervisorTI), eq(estadoAsignada), eq(estadoAsignada),
                eq("Reasignada de Carlos Ruiz a Marcos García: Reemplazo por turno"));
    }

    @Test
    @DisplayName("[CA-9] Iniciar atención actualiza estado a EN_ATENCION y fecha_inicio_atencion")
    void iniciarAtencionExitosa() {
        solicitud.setEstado(estadoAsignada);
        solicitud.setTecnicoAsignado(tecnicoTI);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(tecnicoTI), eq(solicitud), eq(Transicion.INICIAR_ATENCION))).thenReturn(true);
        when(estadoRepository.findById("EN_ATENCION")).thenReturn(Optional.of(estadoEnAtencion));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SolicitudDetalleResponse detalle = workflowService.iniciarAtencion(100L, tecnicoTI);

        assertThat(detalle.estadoCodigo()).isEqualTo("EN_ATENCION");
        assertThat(solicitud.getFechaInicioAtencion()).isNotNull();
        verify(historialService).registrar(solicitud, tecnicoTI, estadoAsignada, estadoEnAtencion, null);
    }

    @Test
    @DisplayName("[CA-10] Resolver con informe >= 20 caracteres y evidencia actualiza estado a RESUELTA")
    void resolverExitosa() throws Exception {
        solicitud.setEstado(estadoEnAtencion);
        solicitud.setTecnicoAsignado(tecnicoTI);

        MockMultipartFile file = new MockMultipartFile(
                "archivos", "foto_solucion.jpg", "image/jpeg", new byte[]{1, 2, 3, 4});

        FileTypeValidator.ValidatedFile valFile = new FileTypeValidator.ValidatedFile(
                "foto_solucion.jpg", "image/jpeg", 4L, file.getBytes());

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(tecnicoTI), eq(solicitud), eq(Transicion.RESOLVER))).thenReturn(true);
        when(fileTypeValidator.validate(any())).thenReturn(valFile);
        when(fileStorageService.store(valFile)).thenReturn(new FileStorageService.StoredFile("uuid.jpg", "solicitudes/uuid.jpg"));
        when(estadoRepository.findById("RESUELTA")).thenReturn(Optional.of(estadoResuelta));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SolicitudResolverRequest req = new SolicitudResolverRequest("Se reemplazó el conector RJ45 dañado correctamente");
        SolicitudDetalleResponse detalle = workflowService.resolver(100L, req, List.of(file), tecnicoTI);

        assertThat(detalle.estadoCodigo()).isEqualTo("RESUELTA");
        assertThat(solicitud.getInformeResolucion()).isEqualTo("Se reemplazó el conector RJ45 dañado correctamente");
        assertThat(solicitud.getFechaResolucion()).isNotNull();
        verify(historialService).registrar(eq(solicitud), eq(tecnicoTI), eq(estadoEnAtencion), eq(estadoResuelta),
                eq("Se reemplazó el conector RJ45 dañado correctamente"));
    }

    @Test
    @DisplayName("[CA-11] Resolver con informe menor a 20 caracteres lanza IllegalArgumentException")
    void resolverInformeCortoFalla() {
        solicitud.setEstado(estadoEnAtencion);
        solicitud.setTecnicoAsignado(tecnicoTI);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(tecnicoTI), eq(solicitud), eq(Transicion.RESOLVER))).thenReturn(true);

        MockMultipartFile file = new MockMultipartFile(
                "archivos", "foto.jpg", "image/jpeg", new byte[]{1, 2});

        SolicitudResolverRequest req = new SolicitudResolverRequest("Arreglado.");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                workflowService.resolver(100L, req, List.of(file), tecnicoTI)
        );

        assertThat(ex.getMessage()).contains("al menos 20 caracteres");
    }

    @Test
    @DisplayName("[CA-11] Resolver sin evidencia lanza IllegalArgumentException")
    void resolverSinEvidenciaFalla() {
        solicitud.setEstado(estadoEnAtencion);
        solicitud.setTecnicoAsignado(tecnicoTI);

        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(eq(tecnicoTI), eq(solicitud), eq(Transicion.RESOLVER))).thenReturn(true);

        SolicitudResolverRequest req = new SolicitudResolverRequest("Se reemplazó el cable por uno completamente nuevo");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                workflowService.resolver(100L, req, List.of(), tecnicoTI)
        );

        assertThat(ex.getMessage()).contains("al menos 1 evidencia");
    }
}
