package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudCreadaResponse;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SolicitudService {

    private static final int MAX_FILES_PER_REQUEST = 3;
    private static final String ESTADO_REGISTRADA = "REGISTRADA";

    private final CategoriaRepository categoriaRepository;
    private final PrioridadRepository prioridadRepository;
    private final EstadoSolicitudRepository estadoRepository;
    private final SolicitudRepository solicitudRepository;
    private final EvidenciaArchivoRepository evidenciaRepository;
    private final HistorialSolicitudRepository historialRepository;
    private final CodigoSolicitudService codigoService;
    private final SlaCalculator slaCalculator;
    private final FileTypeValidator fileTypeValidator;
    private final FileStorageService fileStorageService;
    private final Clock clock;

    public SolicitudService(CategoriaRepository categoriaRepository,
                            PrioridadRepository prioridadRepository,
                            EstadoSolicitudRepository estadoRepository,
                            SolicitudRepository solicitudRepository,
                            EvidenciaArchivoRepository evidenciaRepository,
                            HistorialSolicitudRepository historialRepository,
                            CodigoSolicitudService codigoService,
                            SlaCalculator slaCalculator,
                            FileTypeValidator fileTypeValidator,
                            FileStorageService fileStorageService,
                            Clock clock) {
        this.categoriaRepository = categoriaRepository;
        this.prioridadRepository = prioridadRepository;
        this.estadoRepository = estadoRepository;
        this.solicitudRepository = solicitudRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.historialRepository = historialRepository;
        this.codigoService = codigoService;
        this.slaCalculator = slaCalculator;
        this.fileTypeValidator = fileTypeValidator;
        this.fileStorageService = fileStorageService;
        this.clock = clock;
    }

    @Transactional
    public SolicitudCreadaResponse crear(SolicitudCrearRequest request, List<MultipartFile> archivos, Usuario solicitante) {
        List<MultipartFile> uploads = archivos == null ? List.of() : archivos;
        if (uploads.size() > MAX_FILES_PER_REQUEST) {
            throw new IllegalArgumentException("Se permiten como máximo 3 archivos por solicitud");
        }
        List<FileTypeValidator.ValidatedFile> validatedFiles = uploads.stream()
                .map(fileTypeValidator::validate).toList();

        Categoria categoria = categoriaRepository.findActivaConArea(request.idCategoria())
                .orElseThrow(() -> new IllegalArgumentException("La categoría no existe o está inactiva"));
        Prioridad prioridad = prioridadRepository.findByIdAndActivoTrue(request.idPrioridad())
                .orElseThrow(() -> new IllegalArgumentException("La prioridad no existe o está inactiva"));
        EstadoSolicitud estado = estadoRepository.findById(ESTADO_REGISTRADA)
                .orElseThrow(() -> new IllegalStateException("No está configurado el estado REGISTRADA"));

        LocalDateTime now = LocalDateTime.now(clock);
        Solicitud solicitud = new Solicitud();
        solicitud.setCodigo(codigoService.generarCodigo());
        solicitud.setSolicitante(solicitante);
        solicitud.setCategoria(categoria);
        solicitud.setPrioridad(prioridad);
        solicitud.setTitulo(request.titulo());
        solicitud.setDescripcion(request.descripcion());
        solicitud.setUbicacionCampus(request.ubicacionCampus());
        solicitud.setUbicacionAmbiente(request.ubicacionAmbiente());
        solicitud.setEstado(estado);
        solicitud.setFechaRegistro(now);
        solicitud.setFechaLimiteSla(slaCalculator.calcularFechaLimite(now, prioridad, categoria));
        solicitud = solicitudRepository.save(solicitud);

        Solicitud savedSolicitud = solicitud;
        List<String> storedNames = new ArrayList<>();
        registerRollbackCleanup(storedNames);
        for (FileTypeValidator.ValidatedFile validated : validatedFiles) {
            FileStorageService.StoredFile stored = fileStorageService.store(validated);
            storedNames.add(stored.storedName());

            EvidenciaArchivo evidencia = new EvidenciaArchivo();
            evidencia.setSolicitud(savedSolicitud);
            evidencia.setUsuarioSubio(solicitante);
            evidencia.setTipoEvidencia(TipoEvidencia.INICIAL);
            evidencia.setNombreOriginal(validated.originalName());
            evidencia.setNombreAlmacenado(stored.storedName());
            evidencia.setRutaAlmacenamiento(stored.relativePath());
            evidencia.setMimeType(validated.mimeType());
            evidencia.setTamanoBytes(validated.size());
            evidenciaRepository.save(evidencia);
        }

        HistorialSolicitud historial = new HistorialSolicitud();
        historial.setSolicitud(savedSolicitud);
        historial.setUsuario(solicitante);
        historial.setEstadoAnterior(null);
        historial.setEstadoNuevo(estado);
        historialRepository.save(historial);

        return new SolicitudCreadaResponse(savedSolicitud.getId(), savedSolicitud.getCodigo(),
                savedSolicitud.getTitulo(), estado.getCodigo(), savedSolicitud.getFechaRegistro(),
                savedSolicitud.getFechaLimiteSla());
    }

    private void registerRollbackCleanup(List<String> storedNames) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("La creación de solicitudes requiere una transacción activa");
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
