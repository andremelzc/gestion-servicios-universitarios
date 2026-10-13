package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.HistorialItemResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudDetalleResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import edu.universidad.servicios.solicitud.repository.EvidenciaArchivoRepository;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
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
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudConsultaServiceTest {

    @Mock
    private SolicitudRepository solicitudRepository;

    @Mock
    private EvidenciaArchivoRepository evidenciaRepository;

    @Mock
    private HistorialSolicitudRepository historialRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private AccessPolicy accessPolicy;

    @InjectMocks
    private SolicitudConsultaService service;

    private Usuario estudiante;
    private Usuario otroUsuario;
    private Solicitud solicitud;

    @BeforeEach
    void setUp() {
        Rol rol = new Rol();
        rol.setId(1);
        rol.setNombre("ROLE_ESTUDIANTE");

        Area area = new Area();
        area.setId(1);
        area.setNombre("TI");

        estudiante = new Usuario();
        estudiante.setId(10L);
        estudiante.setNombre("Roberto");
        estudiante.setApellido("Pizarro");
        estudiante.setRol(rol);

        otroUsuario = new Usuario();
        otroUsuario.setId(99L);
        otroUsuario.setNombre("Otro");
        otroUsuario.setApellido("Estudiante");
        otroUsuario.setRol(rol);

        Categoria categoria = new Categoria();
        categoria.setId(2);
        categoria.setNombre("Equipos");
        categoria.setArea(area);

        Prioridad prioridad = new Prioridad();
        prioridad.setId(3);
        prioridad.setNivel("ALTA");

        EstadoSolicitud estado = new EstadoSolicitud();
        estado.setCodigo("REGISTRADA");
        estado.setNombreVisible("Registrada");
        estado.setColorHex("#3B82F6");

        solicitud = new Solicitud();
        solicitud.setId(100L);
        solicitud.setCodigo("SOL-2026-0100");
        solicitud.setTitulo("Falla en monitor");
        solicitud.setDescripcion("El monitor no enciende");
        solicitud.setSolicitante(estudiante);
        solicitud.setCategoria(categoria);
        solicitud.setPrioridad(prioridad);
        solicitud.setEstado(estado);
        solicitud.setFechaRegistro(LocalDateTime.of(2026, 10, 13, 10, 0));
        solicitud.setFechaLimiteSla(LocalDateTime.of(2026, 10, 14, 10, 0));
    }

    @Test
    @DisplayName("listarMisSolicitudes retorna página de solicitudes del usuario (CA-11)")
    void listarMisSolicitudesRetornaResultados() {
        Page<Solicitud> page = new PageImpl<>(List.of(solicitud));
        when(solicitudRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<SolicitudResumenResponse> resultado = service.listarMisSolicitudes(estudiante, "REGISTRADA", "monitor", PageRequest.of(0, 10));

        assertThat(resultado.getContent()).hasSize(1);
        assertThat(resultado.getContent().get(0).codigo()).isEqualTo("SOL-2026-0100");
        verify(solicitudRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("obtenerDetalle retorna detalle cuando el usuario tiene permiso (CA-13)")
    void obtenerDetallePermitido() {
        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(estudiante, solicitud)).thenReturn(true);
        when(accessPolicy.accionesPermitidas(estudiante, solicitud)).thenReturn(List.of("COMENTAR"));
        when(evidenciaRepository.findBySolicitudIdOrderByFechaSubidaAsc(100L)).thenReturn(List.of());

        SolicitudDetalleResponse detalle = service.obtenerDetalle(100L, estudiante);

        assertThat(detalle.id()).isEqualTo(100L);
        assertThat(detalle.codigo()).isEqualTo("SOL-2026-0100");
        assertThat(detalle.accionesPermitidas()).containsExactly("COMENTAR");
    }

    @Test
    @DisplayName("obtenerDetalle lanza 404 cuando la solicitud es ajena (RN-16 / CA-12 IDOR)")
    void obtenerDetalleAjenaLanza404() {
        when(solicitudRepository.findByIdConDetalles(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(otroUsuario, solicitud)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                service.obtenerDetalle(100L, otroUsuario)
        );

        assertThat(ex.getStatusCode().value()).isEqualTo(404);
        verify(evidenciaRepository, never()).findBySolicitudIdOrderByFechaSubidaAsc(any());
    }

    @Test
    @DisplayName("obtenerHistorial retorna eventos cronológicos para usuario autorizado")
    void obtenerHistorialAutorizado() {
        HistorialSolicitud h1 = new HistorialSolicitud();
        h1.setId(1L);
        h1.setSolicitud(solicitud);
        h1.setUsuario(estudiante);
        h1.setEstadoNuevo(solicitud.getEstado());
        h1.setFechaCambio(LocalDateTime.of(2026, 10, 13, 10, 5));

        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(estudiante, solicitud)).thenReturn(true);
        when(historialRepository.findBySolicitudIdConDetalles(100L)).thenReturn(List.of(h1));

        List<HistorialItemResponse> historial = service.obtenerHistorial(100L, estudiante);

        assertThat(historial).hasSize(1);
        assertThat(historial.get(0).estadoNuevo()).isEqualTo("REGISTRADA");
    }

    @Test
    @DisplayName("descargarEvidencia retorna bytes de archivo cuando pertenece a la solicitud")
    void descargarEvidenciaExitosa() {
        EvidenciaArchivo evidencia = new EvidenciaArchivo();
        evidencia.setId(50L);
        evidencia.setSolicitud(solicitud);
        evidencia.setNombreOriginal("foto.jpg");
        evidencia.setNombreAlmacenado("abc-123.jpg");
        evidencia.setMimeType("image/jpeg");

        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(accessPolicy.puedeVer(estudiante, solicitud)).thenReturn(true);
        when(evidenciaRepository.findById(50L)).thenReturn(Optional.of(evidencia));
        when(fileStorageService.read("abc-123.jpg")).thenReturn(new byte[]{1, 2, 3});

        var descarga = service.descargarEvidencia(100L, 50L, estudiante);

        assertThat(descarga.nombreOriginal()).isEqualTo("foto.jpg");
        assertThat(descarga.mimeType()).isEqualTo("image/jpeg");
        assertThat(descarga.contenido()).containsExactly(1, 2, 3);
    }
}
