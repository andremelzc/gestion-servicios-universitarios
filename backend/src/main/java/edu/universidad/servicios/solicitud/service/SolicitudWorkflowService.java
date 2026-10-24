package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.SolicitudAsignarRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudCerrarRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudDetalleResponse;
import edu.universidad.servicios.solicitud.dto.SolicitudEvaluarRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudResolverRequest;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio encargado de gestionar y ejecutar el ciclo de vida y máquina de estados
 * de las solicitudes de servicio (GES-03 / US-08 / US-09 / US-10 / RN-06).
 */
@Service
@RequiredArgsConstructor
public class SolicitudWorkflowService {

    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstadoSolicitudRepository estadoRepository;
    private final PrioridadRepository prioridadRepository;
    private final EvidenciaArchivoRepository evidenciaRepository;
    private final HistorialService historialService;
    private final AccessPolicy accessPolicy;
    private final FileStorageService fileStorageService;
    private final FileTypeValidator fileTypeValidator;
    private final SlaCalculator slaCalculator;
    private final Clock clock;

    /**
     * Asigna o reasigna un técnico operativo a la solicitud (GES-06 / US-08 / CA-1 / CA-2 / CA-8 / RN-07).
     * Aplica el atajo de usabilidad de ADR-003 si la solicitud está en estado REGISTRADA.
     */
    @Transactional
    public SolicitudDetalleResponse asignar(Long id, SolicitudAsignarRequest request, Usuario actor) {
        Solicitud solicitud = buscarConValidacionAcceso(id, actor);
        String estadoActual = obtenerCodigoEstado(solicitud);

        Transicion transicion = Transicion.resolverTransicionAsignacion(estadoActual);
        if (transicion == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede asignar una solicitud en estado " + estadoActual);
        }

        if (!accessPolicy.puedeEjecutar(actor, solicitud, transicion)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tiene permisos para asignar esta solicitud.");
        }

        if (request == null || request.idTecnico() == null) {
            throw new IllegalArgumentException("El id del técnico es obligatorio");
        }

        Usuario tecnico = usuarioRepository.findById(request.idTecnico())
                .orElseThrow(() -> new IllegalArgumentException("El técnico especificado no existe"));

        if (!Boolean.TRUE.equals(tecnico.getActivo())) {
            throw new IllegalArgumentException("El técnico seleccionado no está activo");
        }

        String rolTecnico = (tecnico.getRol() != null && tecnico.getRol().getNombre() != null)
                ? tecnico.getRol().getNombre().toUpperCase()
                : "";
        if (!rolTecnico.contains("TECNICO")) {
            throw new IllegalArgumentException("El usuario seleccionado no tiene rol de técnico");
        }

        Integer areaCategoriaId = (solicitud.getCategoria() != null && solicitud.getCategoria().getArea() != null)
                ? solicitud.getCategoria().getArea().getId()
                : null;
        Integer areaTecnicoId = (tecnico.getArea() != null) ? tecnico.getArea().getId() : null;

        if (areaCategoriaId == null || !areaCategoriaId.equals(areaTecnicoId)) {
            throw new IllegalArgumentException("El técnico no pertenece al área de la categoría de la solicitud");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        EstadoSolicitud estadoAsignada = estadoRepository.findById("ASIGNADA")
                .orElseThrow(() -> new IllegalStateException("Estado ASIGNADA no configurado"));

        if (transicion == Transicion.ASIGNAR) {
            if ("REGISTRADA".equals(estadoActual)) {
                // Atajo ADR-003: registro de dos pasos en historial dentro de la misma transacción
                EstadoSolicitud estadoEvaluacion = estadoRepository.findById("EN_EVALUACION")
                        .orElseThrow(() -> new IllegalStateException("Estado EN_EVALUACION no configurado"));
                historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoEvaluacion, null);
                historialService.registrar(solicitud, actor, estadoEvaluacion, estadoAsignada, request.nota());
            } else {
                historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoAsignada, request.nota());
            }
        } else { // REASIGNAR (T6)
            Usuario tecnicoAnterior = solicitud.getTecnicoAsignado();
            String anteriorNombre = (tecnicoAnterior != null)
                    ? (tecnicoAnterior.getNombre() + " " + tecnicoAnterior.getApellido()).trim()
                    : "sin asignar";
            String nuevoNombre = (tecnico.getNombre() + " " + tecnico.getApellido()).trim();

            String notaReasignacion = "Reasignada de " + anteriorNombre + " a " + nuevoNombre;
            if (request.nota() != null && !request.nota().isBlank()) {
                notaReasignacion += ": " + request.nota().trim();
            }
            historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoAsignada, notaReasignacion);
        }

        solicitud.setTecnicoAsignado(tecnico);
        solicitud.setSupervisorAsignador(actor);
        solicitud.setFechaAsignacion(now);
        solicitud.setEstado(estadoAsignada);
        solicitud = solicitudRepository.save(solicitud);

        return construirRespuestaDetalle(solicitud, actor);
    }

    /**
     * Marca el inicio de la intervención operativa sobre la solicitud (GES-07 / US-09 / CA-9).
     */
    @Transactional
    public SolicitudDetalleResponse iniciarAtencion(Long id, Usuario actor) {
        Solicitud solicitud = buscarConValidacionAcceso(id, actor);
        String estadoActual = obtenerCodigoEstado(solicitud);

        if (!Transicion.INICIAR_ATENCION.esOrigenValido(estadoActual)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud debe estar ASIGNADA para iniciar atención.");
        }

        if (!accessPolicy.puedeEjecutar(actor, solicitud, Transicion.INICIAR_ATENCION)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el técnico asignado o un administrador pueden iniciar la atención.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        EstadoSolicitud estadoEnAtencion = estadoRepository.findById("EN_ATENCION")
                .orElseThrow(() -> new IllegalStateException("Estado EN_ATENCION no configurado"));

        historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoEnAtencion, null);

        solicitud.setEstado(estadoEnAtencion);
        solicitud.setFechaInicioAtencion(now);
        solicitud = solicitudRepository.save(solicitud);

        return construirRespuestaDetalle(solicitud, actor);
    }

    /**
     * Resuelve la solicitud requiriendo informe técnico y entre 1 y 3 evidencias (GES-08 / US-10 / CA-10 / CA-11 / CA-12).
     */
    @Transactional
    public SolicitudDetalleResponse resolver(Long id, SolicitudResolverRequest request, List<MultipartFile> archivos, Usuario actor) {
        Solicitud solicitud = buscarConValidacionAcceso(id, actor);
        String estadoActual = obtenerCodigoEstado(solicitud);

        if (!Transicion.RESOLVER.esOrigenValido(estadoActual)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud debe estar EN_ATENCION para ser resuelta.");
        }

        if (!accessPolicy.puedeEjecutar(actor, solicitud, Transicion.RESOLVER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el técnico asignado o un administrador pueden resolver la solicitud.");
        }

        if (request == null || request.informe() == null || request.informe().trim().length() < 20) {
            throw new IllegalArgumentException("El informe de resolución debe contener al menos 20 caracteres.");
        }

        List<MultipartFile> uploads = (archivos == null) ? List.of() : archivos;
        if (uploads.isEmpty()) {
            throw new IllegalArgumentException("Se requiere al menos 1 evidencia para resolver la solicitud.");
        }
        if (uploads.size() > 3) {
            throw new IllegalArgumentException("Se permiten como máximo 3 evidencias para resolver la solicitud.");
        }

        List<FileTypeValidator.ValidatedFile> validatedFiles = uploads.stream()
                .map(fileTypeValidator::validate).toList();

        LocalDateTime now = LocalDateTime.now(clock);
        List<String> storedNames = new ArrayList<>();
        registerRollbackCleanup(storedNames);

        for (FileTypeValidator.ValidatedFile val : validatedFiles) {
            FileStorageService.StoredFile stored = fileStorageService.store(val);
            storedNames.add(stored.storedName());

            EvidenciaArchivo ev = new EvidenciaArchivo();
            ev.setSolicitud(solicitud);
            ev.setUsuarioSubio(actor);
            ev.setTipoEvidencia(TipoEvidencia.SOLUCION);
            ev.setNombreOriginal(val.originalName());
            ev.setNombreAlmacenado(stored.storedName());
            ev.setRutaAlmacenamiento(stored.relativePath());
            ev.setMimeType(val.mimeType());
            ev.setTamanoBytes(val.size());
            evidenciaRepository.save(ev);
        }

        EstadoSolicitud estadoResuelta = estadoRepository.findById("RESUELTA")
                .orElseThrow(() -> new IllegalStateException("Estado RESUELTA no configurado"));

        String informe = request.informe().trim();
        historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoResuelta, informe);

        solicitud.setInformeResolucion(informe);
        solicitud.setFechaResolucion(now);
        solicitud.setEstado(estadoResuelta);
        solicitud = solicitudRepository.save(solicitud);

        return construirRespuestaDetalle(solicitud, actor);
    }

    /**
     * Evalúa una solicitud en REGISTRADA pasando a EN_EVALUACION con ajuste de prioridad opcional (US-23 / CA-6).
     */
    @Transactional
    public SolicitudDetalleResponse evaluar(Long id, Integer idPrioridad, String nota, Usuario actor) {
        Solicitud solicitud = buscarConValidacionAcceso(id, actor);
        String estadoActual = obtenerCodigoEstado(solicitud);

        if (!Transicion.EVALUAR.esOrigenValido(estadoActual)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud debe estar REGISTRADA para ser evaluada.");
        }

        if (!accessPolicy.puedeEjecutar(actor, solicitud, Transicion.EVALUAR)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tiene permisos para evaluar esta solicitud.");
        }

        if (idPrioridad != null) {
            Prioridad nuevaPrioridad = prioridadRepository.findByIdAndActivoTrue(idPrioridad)
                    .orElseThrow(() -> new IllegalArgumentException("La prioridad no existe o está inactiva"));
            solicitud.setPrioridad(nuevaPrioridad);
            solicitud.setFechaLimiteSla(slaCalculator.calcularFechaLimite(
                    solicitud.getFechaRegistro(), nuevaPrioridad, solicitud.getCategoria()));
        }

        EstadoSolicitud estadoEnEvaluacion = estadoRepository.findById("EN_EVALUACION")
                .orElseThrow(() -> new IllegalStateException("Estado EN_EVALUACION no configurado"));

        historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoEnEvaluacion, nota);

        solicitud.setEstado(estadoEnEvaluacion);
        solicitud = solicitudRepository.save(solicitud);

        return construirRespuestaDetalle(solicitud, actor);
    }

    /**
     * Cierra formalmente una solicitud RESUELTA pasando a CERRADA (US-25 / CA-14).
     */
    @Transactional
    public SolicitudDetalleResponse cerrar(Long id, String nota, Usuario actor) {
        Solicitud solicitud = buscarConValidacionAcceso(id, actor);
        String estadoActual = obtenerCodigoEstado(solicitud);

        if (!Transicion.CERRAR.esOrigenValido(estadoActual)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud debe estar RESUELTA para poder ser cerrada.");
        }

        if (!accessPolicy.puedeEjecutar(actor, solicitud, Transicion.CERRAR)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tiene permisos para cerrar esta solicitud.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        EstadoSolicitud estadoCerrada = estadoRepository.findById("CERRADA")
                .orElseThrow(() -> new IllegalStateException("Estado CERRADA no configurado"));

        historialService.registrar(solicitud, actor, solicitud.getEstado(), estadoCerrada, nota);

        solicitud.setEstado(estadoCerrada);
        solicitud.setFechaCierre(now);
        solicitud = solicitudRepository.save(solicitud);

        return construirRespuestaDetalle(solicitud, actor);
    }

    /**
     * Método genérico de transición según diseño de workflow (Plan 03 §1.2).
     */
    @Transactional
    public SolicitudDetalleResponse ejecutar(Transicion transicion, Long id, Usuario actor, Object datos) {
        return switch (transicion) {
            case ASIGNAR, REASIGNAR -> {
                if (datos instanceof SolicitudAsignarRequest req) {
                    yield asignar(id, req, actor);
                }
                throw new IllegalArgumentException("Datos inválidos para asignación");
            }
            case INICIAR_ATENCION -> iniciarAtencion(id, actor);
            case RESOLVER -> {
                if (datos instanceof Object[] arr && arr.length >= 2
                        && arr[0] instanceof SolicitudResolverRequest req
                        && arr[1] instanceof List<?> list) {
                    @SuppressWarnings("unchecked")
                    List<MultipartFile> files = (List<MultipartFile>) list;
                    yield resolver(id, req, files, actor);
                }
                throw new IllegalArgumentException("Datos inválidos para resolución");
            }
            case EVALUAR -> {
                if (datos instanceof SolicitudEvaluarRequest req) {
                    yield evaluar(id, req.idPrioridad(), req.nota(), actor);
                }
                if (datos instanceof Integer idPrio) {
                    yield evaluar(id, idPrio, null, actor);
                }
                yield evaluar(id, null, null, actor);
            }
            case CERRAR -> {
                if (datos instanceof SolicitudCerrarRequest req) {
                    yield cerrar(id, req.nota(), actor);
                }
                String nota = (datos instanceof String s) ? s : null;
                yield cerrar(id, nota, actor);
            }
        };
    }

    private Solicitud buscarConValidacionAcceso(Long id, Usuario actor) {
        Solicitud solicitud = solicitudRepository.findByIdConDetalles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (!accessPolicy.puedeVer(actor, solicitud)) {
            // Protección IDOR (RN-16): responde 404 para ocultar existencia a no autorizados
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }

        return solicitud;
    }

    private String obtenerCodigoEstado(Solicitud solicitud) {
        return (solicitud.getEstado() != null) ? solicitud.getEstado().getCodigo() : "";
    }

    private SolicitudDetalleResponse construirRespuestaDetalle(Solicitud solicitud, Usuario actor) {
        List<EvidenciaArchivo> evidencias = evidenciaRepository.findBySolicitudIdOrderByFechaSubidaAsc(solicitud.getId());
        List<String> acciones = accessPolicy.accionesPermitidas(actor, solicitud);
        return SolicitudDetalleResponse.de(solicitud, evidencias, acciones);
    }

    private void registerRollbackCleanup(List<String> storedNames) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storedNames.forEach(fileStorageService::delete);
                }
            }
        });
    }
}
