package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.domain.Transicion;
import edu.universidad.servicios.solicitud.dto.SolicitudAsignarRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudResolverRequest;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
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
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas de transiciones inválidas contra la matriz oficial (GES-05 / RN-06 / CA-12).
 */
@ExtendWith(MockitoExtension.class)
class TransicionesInvalidasTest {

    @Mock
    private SolicitudRepository solicitudRepository;

    @Mock
    private AccessPolicy accessPolicy;

    @Spy
    private Clock clock = Clock.fixed(Instant.parse("2026-10-15T12:00:00Z"), ZoneOffset.UTC);

    @InjectMocks
    private SolicitudWorkflowService workflowService;

    private Usuario supervisorTI;
    private Usuario tecnicoTI;
    private Solicitud solicitud;

    private EstadoSolicitud estadoRegistrada;
    private EstadoSolicitud estadoAsignada;
    private EstadoSolicitud estadoEnAtencion;
    private EstadoSolicitud estadoResuelta;
    private EstadoSolicitud estadoCerrada;

    @BeforeEach
    void setUp() {
        Area areaTI = new Area();
        areaTI.setId(1);
        areaTI.setNombre("TI");

        Rol rolSupervisor = new Rol();
        rolSupervisor.setId(3);
        rolSupervisor.setNombre("ROLE_SUPERVISOR");

        Rol rolTecnico = new Rol();
        rolTecnico.setId(2);
        rolTecnico.setNombre("ROLE_TECNICO");

        supervisorTI = new Usuario();
        supervisorTI.setId(30L);
        supervisorTI.setNombre("Ana");
        supervisorTI.setRol(rolSupervisor);
        supervisorTI.setArea(areaTI);

        tecnicoTI = new Usuario();
        tecnicoTI.setId(20L);
        tecnicoTI.setNombre("Carlos");
        tecnicoTI.setRol(rolTecnico);
        tecnicoTI.setArea(areaTI);

        Categoria categoria = new Categoria();
        categoria.setId(1);
        categoria.setNombre("Redes");
        categoria.setArea(areaTI);

        estadoRegistrada = new EstadoSolicitud();
        estadoRegistrada.setCodigo("REGISTRADA");

        estadoAsignada = new EstadoSolicitud();
        estadoAsignada.setCodigo("ASIGNADA");

        estadoEnAtencion = new EstadoSolicitud();
        estadoEnAtencion.setCodigo("EN_ATENCION");

        estadoResuelta = new EstadoSolicitud();
        estadoResuelta.setCodigo("RESUELTA");

        estadoCerrada = new EstadoSolicitud();
        estadoCerrada.setCodigo("CERRADA");

        solicitud = new Solicitud();
        solicitud.setId(200L);
        solicitud.setCodigo("SOL-2026-0200");
        solicitud.setCategoria(categoria);
        solicitud.setFechaRegistro(LocalDateTime.now(clock));
    }

    @Test
    @DisplayName("[CA-12] Intentar resolver una solicitud en estado REGISTRADA lanza 409 Conflict")
    void resolverDesdeRegistradaLanza409() {
        solicitud.setEstado(estadoRegistrada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);

        MockMultipartFile file = new MockMultipartFile("archivos", "foto.jpg", "image/jpeg", new byte[]{1, 2});
        SolicitudResolverRequest req = new SolicitudResolverRequest("Se resolvió el incidente con éxito total.");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.resolver(200L, req, List.of(file), tecnicoTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ex.getReason()).contains("La solicitud debe estar EN_ATENCION para ser resuelta");
    }

    @Test
    @DisplayName("[CA-12] Intentar resolver una solicitud en estado ASIGNADA lanza 409 Conflict")
    void resolverDesdeAsignadaLanza409() {
        solicitud.setEstado(estadoAsignada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);

        MockMultipartFile file = new MockMultipartFile("archivos", "foto.jpg", "image/jpeg", new byte[]{1, 2});
        SolicitudResolverRequest req = new SolicitudResolverRequest("Se resolvió el incidente con éxito total.");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.resolver(200L, req, List.of(file), tecnicoTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("[CA-12] Intentar iniciar atención sobre una solicitud en REGISTRADA lanza 409 Conflict")
    void iniciarAtencionDesdeRegistradaLanza409() {
        solicitud.setEstado(estadoRegistrada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.iniciarAtencion(200L, tecnicoTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ex.getReason()).contains("La solicitud debe estar ASIGNADA para iniciar atención");
    }

    @Test
    @DisplayName("[CA-12] Intentar iniciar atención sobre una solicitud ya en EN_ATENCION lanza 409 Conflict")
    void iniciarAtencionDesdeEnAtencionLanza409() {
        solicitud.setEstado(estadoEnAtencion);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(tecnicoTI, solicitud)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.iniciarAtencion(200L, tecnicoTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("[CA-12] Intentar asignar una solicitud en estado RESUELTA lanza 409 Conflict")
    void asignarDesdeResueltaLanza409() {
        solicitud.setEstado(estadoResuelta);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Asignar");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.asignar(200L, req, supervisorTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ex.getReason()).contains("No se puede asignar una solicitud en estado RESUELTA");
    }

    @Test
    @DisplayName("[CA-12] Intentar cualquier transición sobre solicitud CERRADA lanza 409 Conflict")
    void transicionSobreCerradaLanza409() {
        solicitud.setEstado(estadoCerrada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Asignar");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.asignar(200L, req, supervisorTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("[RN-16 / IDOR] Consultar solicitud de otra área responde 404 Not Found")
    void solicitudFueraDeAlcanceResponde404() {
        solicitud.setEstado(estadoRegistrada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(false);

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Nota");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.asignar(200L, req, supervisorTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("[CA-3 / CA-9] Usuario sin permisos para ejecutar transición responde 403 Forbidden")
    void sinPermisoDeEjecucionResponde403() {
        solicitud.setEstado(estadoAsignada);
        when(solicitudRepository.findByIdConDetalles(200L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(supervisorTI, solicitud)).thenReturn(true);
        when(accessPolicy.puedeEjecutar(supervisorTI, solicitud, Transicion.INICIAR_ATENCION)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                workflowService.iniciarAtencion(200L, supervisorTI)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
