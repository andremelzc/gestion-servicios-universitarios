package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.common.validation.PaginacionValidator;
import edu.universidad.servicios.solicitud.domain.EvidenciaArchivo;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.dto.HistorialItemResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudDetalleResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import edu.universidad.servicios.solicitud.repository.EvidenciaArchivoRepository;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudSpecification;
import edu.universidad.servicios.usuario.domain.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

/**
 * Servicio de consultas para mis-solicitudes, detalle, historial y descarga de evidencias (REG-11 / REG-12 / OPS-11).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SolicitudConsultaService {

    public static final Set<String> SORT_WHITELIST = Set.of(
            "fechaRegistro",
            "codigo",
            "titulo",
            "fechaLimiteSla",
            "id",
            "prioridad",
            "prioridad.peso",
            "prioridad.id",
            "estado",
            "estado.orden",
            "estado.codigo",
            "fechaResolucion",
            "fechaCierre"
    );

    private final SolicitudRepository solicitudRepository;
    private final EvidenciaArchivoRepository evidenciaRepository;
    private final HistorialSolicitudRepository historialRepository;
    private final FileStorageService fileStorageService;
    private final AccessPolicy accessPolicy;
    private final java.time.Clock clock;

    /**
     * Lista las solicitudes de la bandeja general según el alcance del rol y filtros (GES-09 / RF-12 / CA-16 / OPS-11).
     * Técnico: solicitudes asignadas a él.
     * Supervisor: solicitudes de categorías pertenecientes a su área.
     * Administrador: todas las solicitudes o según filtro.
     * Estudiante: 403 Forbidden (debe usar mis-solicitudes).
     */
    public Page<SolicitudResumenResponse> listarBandeja(
            Usuario usuario,
            List<String> estados,
            Integer idPrioridad,
            Integer idCategoria,
            Long idTecnico,
            String q,
            java.time.LocalDateTime desde,
            java.time.LocalDateTime hasta,
            Boolean vencidas,
            Pageable pageable
    ) {
        if (usuario == null || usuario.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No está autenticado o sus credenciales son inválidas.");
        }

        String rol = normalizarRol(usuario);
        if ("ESTUDIANTE".equals(rol)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los estudiantes deben consultar a través de mis-solicitudes.");
        }

        Long scopeTecnicoId = null;
        Integer scopeAreaId = null;

        if ("TECNICO".equals(rol)) {
            scopeTecnicoId = usuario.getId();
        } else if ("SUPERVISOR".equals(rol)) {
            if (usuario.getArea() == null || usuario.getArea().getId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El supervisor no tiene un área asignada.");
            }
            scopeAreaId = usuario.getArea().getId();
        } else if (!"ADMIN".equals(rol)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene permisos para consultar la bandeja.");
        }

        Pageable sanitizedPageable = sanitizarPageable(pageable);
        Specification<Solicitud> spec = SolicitudSpecification.paraBandeja(
                scopeTecnicoId,
                scopeAreaId,
                estados,
                idPrioridad,
                idCategoria,
                idTecnico,
                q,
                desde,
                hasta,
                vencidas,
                java.time.LocalDateTime.now(clock)
        );

        return solicitudRepository.findAll(spec, sanitizedPageable)
                .map(s -> SolicitudResumenResponse.de(s, clock));
    }

    /**
     * Lista las solicitudes registradas exclusivamente por el usuario autenticado (REG-11 / US-21 / CA-11 / OPS-11).
     *
     * @param usuario  Usuario solicitante autenticado.
     * @param estado   Filtro opcional por código de estado (ej: "REGISTRADA", "CERRADA").
     * @param q        Búsqueda por texto en código, título o descripción.
     * @param pageable Parámetros de paginación y ordenamiento.
     * @return Página de {@link SolicitudResumenResponse}.
     */
    public Page<SolicitudResumenResponse> listarMisSolicitudes(
            Usuario usuario,
            String estado,
            String q,
            Pageable pageable
    ) {
        if (usuario == null || usuario.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No está autenticado o sus credenciales son inválidas.");
        }

        Pageable sanitizedPageable = sanitizarPageable(pageable);
        Specification<Solicitud> spec = SolicitudSpecification.conFiltros(
                usuario.getId(),
                estado,
                null,
                null,
                q,
                null,
                null
        );

        return solicitudRepository.findAll(spec, sanitizedPageable)
                .map(s -> SolicitudResumenResponse.de(s, clock));
    }

    /**
     * Obtiene el detalle completo de una solicitud aplicando políticas de visibilidad (REG-12 / RN-16 / CA-12 / CA-13).
     *
     * @param id      ID de la solicitud.
     * @param usuario Usuario consultante.
     * @return {@link SolicitudDetalleResponse} con evidencias y acciones permitidas.
     */
    public SolicitudDetalleResponse obtenerDetalle(Long id, Usuario usuario) {
        Solicitud solicitud = solicitudRepository.findByIdConDetalles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (!accessPolicy.puedeVer(usuario, solicitud)) {
            // Regla RN-16 y CA-12: respuesta 404 para no revelar existencia a usuarios no autorizados (IDOR)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }

        List<EvidenciaArchivo> evidencias = evidenciaRepository.findBySolicitudIdOrderByFechaSubidaAsc(id);
        List<String> acciones = accessPolicy.accionesPermitidas(usuario, solicitud);

        return SolicitudDetalleResponse.de(solicitud, evidencias, acciones);
    }

    /**
     * Obtiene la línea de tiempo cronológica inmutable del historial de una solicitud (REG-12).
     */
    public List<HistorialItemResponse> obtenerHistorial(Long id, Usuario usuario) {
        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (!accessPolicy.puedeVer(usuario, solicitud)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }

        return historialRepository.findBySolicitudIdConDetalles(id)
                .stream()
                .map(HistorialItemResponse::de)
                .toList();
    }

    /**
     * Descarga de evidencia protegida con verificación de alcance (REG-12 / RN-16).
     */
    public EvidenciaDescarga descargarEvidencia(Long id, Long idEvidencia, Usuario usuario) {
        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (!accessPolicy.puedeVer(usuario, solicitud)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }

        EvidenciaArchivo evidencia = evidenciaRepository.findById(idEvidencia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidencia no encontrada"));

        if (!evidencia.getSolicitud().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La evidencia no pertenece a esta solicitud");
        }

        byte[] contenido = fileStorageService.read(evidencia.getNombreAlmacenado());
        return new EvidenciaDescarga(evidencia.getNombreOriginal(), evidencia.getMimeType(), contenido);
    }

    public record EvidenciaDescarga(String nombreOriginal, String mimeType, byte[] contenido) {}

    private Pageable sanitizarPageable(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "fechaRegistro"));
        }
        PaginacionValidator.validar(pageable, SORT_WHITELIST);

        Sort sort = (pageable.getSort() != null && pageable.getSort().isSorted())
                ? pageable.getSort()
                : Sort.by(Sort.Direction.DESC, "fechaRegistro");

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private String normalizarRol(Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getNombre() == null) {
            return "";
        }
        return usuario.getRol().getNombre().toUpperCase().replace("ROLE_", "").trim();
    }
}
