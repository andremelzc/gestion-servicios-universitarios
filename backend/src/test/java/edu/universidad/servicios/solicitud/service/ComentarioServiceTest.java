package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.ComentarioCrearRequest;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.usuario.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.time.*;
import java.util.*;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ComentarioServiceTest {
    private final ComentarioRepository comentarios = mock(ComentarioRepository.class);
    private final SolicitudRepository solicitudes = mock(SolicitudRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-11T12:00:00Z"), ZoneOffset.UTC);
    private final ComentarioService service = new ComentarioService(comentarios, solicitudes, new AccessPolicy(), clock);
    private Usuario estudiante;
    private Solicitud solicitud;

    @BeforeEach
    void preparar() {
        estudiante = actor("ESTUDIANTE", 1L);
        solicitud = new Solicitud();
        solicitud.setSolicitante(estudiante);
        EstadoSolicitud estado = new EstadoSolicitud();
        estado.setCodigo("REGISTRADA");
        solicitud.setEstado(estado);
        when(solicitudes.findByIdConDetalles(10L)).thenReturn(Optional.of(solicitud));
    }

    @Test
    void estudianteSoloVePublicosCa18() {
        when(comentarios.findVisibles(10L, false)).thenReturn(List.of());
        assertTrue(service.listar(10L, estudiante).isEmpty());
        verify(comentarios).findVisibles(10L, false);
    }

    @ParameterizedTest
    @ValueSource(strings = {"TECNICO", "SUPERVISOR", "ADMIN", "ROLE_ADMIN"})
    void internosVenYCreanPrivadosCa18(String rol) {
        Usuario interno = actor(rol, 2L);
        solicitud.setTecnicoAsignado(interno);
        // También un interno solicitante conserva el alcance definido por AccessPolicy.
        solicitud.setSolicitante(interno);
        ComentarioSolicitud publico = comentario(false);
        ComentarioSolicitud privado = comentario(true);
        when(comentarios.findVisibles(10L, true)).thenReturn(List.of(publico, privado));
        assertEquals(2, service.listar(10L, interno).size());
        when(comentarios.save(any())).thenAnswer(i -> i.getArgument(0));
        var creado = service.crear(10L, interno, new ComentarioCrearRequest("Nota interna", true));
        assertTrue(creado.privado());
        assertEquals(LocalDateTime.now(clock), creado.fechaComentario());
    }

    @Test
    void estudianteNoCreaPrivadosCa18() {
        error(403, () -> service.crear(10L, estudiante, new ComentarioCrearRequest("Privado", true)));
        verifyNoInteractions(comentarios);
    }

    @Test
    void creaPublicoConAutorYFechaDelServidor() {
        when(comentarios.save(any())).thenAnswer(i -> i.getArgument(0));
        var resultado = service.crear(10L, estudiante, new ComentarioCrearRequest("Consulta", false));
        assertEquals("Consulta", resultado.comentario());
        assertFalse(resultado.privado());
        assertEquals("Ana Pérez", resultado.usuario());
        verify(comentarios).save(argThat(c -> c.getSolicitud() == solicitud && c.getUsuario() == estudiante));
    }

    @Test
    void cerradaNoAdmiteComentariosPeroPermiteLecturaCa19() {
        solicitud.getEstado().setCodigo("CERRADA");
        error(409, () -> service.crear(10L, estudiante, new ComentarioCrearRequest("Consulta", false)));
        verify(comentarios, never()).save(any());
        when(comentarios.findVisibles(10L, false)).thenReturn(List.of());
        assertTrue(service.listar(10L, estudiante).isEmpty());
    }

    @Test
    void resueltaTodaviaPermiteComentar() {
        solicitud.getEstado().setCodigo("RESUELTA");
        when(comentarios.save(any())).thenAnswer(i -> i.getArgument(0));
        assertNotNull(service.crear(10L, estudiante, new ComentarioCrearRequest("Gracias", false)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ESTUDIANTE", "TECNICO", "SUPERVISOR"})
    void fueraDeAlcanceDevuelve404SinLeerNiEscribir(String rol) {
        Usuario ajeno = actor(rol, 99L);
        error(404, () -> service.listar(10L, ajeno));
        error(404, () -> service.crear(10L, ajeno, new ComentarioCrearRequest("Consulta", false)));
        verifyNoInteractions(comentarios);
    }

    @Test
    void inexistenteDevuelve404() {
        when(solicitudes.findByIdConDetalles(10L)).thenReturn(Optional.empty());
        error(404, () -> service.listar(10L, estudiante));
        error(404, () -> service.crear(10L, estudiante, new ComentarioCrearRequest("Consulta", false)));
        verifyNoInteractions(comentarios);
    }

    private ComentarioSolicitud comentario(boolean privado) {
        ComentarioSolicitud c = new ComentarioSolicitud();
        c.setUsuario(estudiante);
        c.setComentario("Texto");
        c.setPrivado(privado);
        return c;
    }

    private Usuario actor(String nombreRol, Long id) {
        Rol rol = new Rol();
        rol.setNombre(nombreRol);
        Usuario u = new Usuario();
        u.setId(id);
        u.setRol(rol);
        u.setNombre("Ana");
        u.setApellido("Pérez");
        return u;
    }

    private void error(int status, Runnable accion) {
        assertEquals(status, assertThrows(ResponseStatusException.class, accion::run).getStatusCode().value());
    }
}
