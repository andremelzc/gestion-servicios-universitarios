package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.common.validation.PaginacionValidator;
import edu.universidad.servicios.solicitud.dto.*;
import edu.universidad.servicios.solicitud.service.SolicitudConsultaService;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.solicitud.service.SolicitudWorkflowService;
import edu.universidad.servicios.usuario.domain.Usuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para el ciclo de vida, transiciones, registro y consulta de solicitudes
 * (REG-09, REG-11, REG-12, GES-06..GES-11, GES-13, GES-14, OPS-28).
 */
@RestController
@RequestMapping("/api/v1/solicitudes")
@RequiredArgsConstructor
@Tag(name = "Solicitudes", description = "Endpoints para registro, ciclo de vida, transiciones y consulta de solicitudes")
@SecurityRequirement(name = "bearerAuth")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final SolicitudConsultaService solicitudConsultaService;
    private final SolicitudWorkflowService solicitudWorkflowService;

    /**
     * Registra una nueva solicitud de servicio con evidencias adjuntas (REG-09 / Issue #42).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Registrar solicitud",
            description = "Registra una nueva solicitud de servicio institucional adjuntando opcionalmente entre 0 y 3 archivos de evidencia (JPG, PNG o PDF de hasta 5 MB)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Solicitud creada exitosamente",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudCreadaResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de solicitud inválidos o categoría/prioridad inexistente o inactiva"),
            @ApiResponse(responseCode = "401", description = "No autenticado o token vencido"),
            @ApiResponse(responseCode = "413", description = "El tamaño de un archivo adjunto excede los 5 MB"),
            @ApiResponse(responseCode = "415", description = "Tipo de archivo no permitido (solo JPG, PNG y PDF)")
    })
    public ResponseEntity<SolicitudCreadaResponse> crear(
            @Valid @RequestPart("solicitud") SolicitudCrearRequest request,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario solicitante = resolverUsuario(usuarioDetails, authentication);
        SolicitudCreadaResponse response = solicitudService.crear(request, archivos, solicitante);
        URI location = URI.create("/api/v1/solicitudes/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    /**
     * Consulta el listado paginado de solicitudes registradas por el usuario autenticado (REG-11 / US-21 / CA-11).
     */
    @GetMapping("/mis-solicitudes")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Listar mis solicitudes",
            description = "Retorna el listado paginado de solicitudes registradas por el usuario solicitante autenticado con filtros opcionales por estado y búsqueda textual."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Página de solicitudes del usuario"),
            @ApiResponse(responseCode = "400", description = "Parámetros de paginación u ordenamiento inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public ResponseEntity<Page<SolicitudResumenResponse>> misSolicitudes(
            @Parameter(description = "Código de estado opcional (ej: REGISTRADA, CERRADA)")
            @RequestParam(required = false) String estado,
            @Parameter(description = "Texto a buscar en código, título o descripción")
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "fechaRegistro", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario solicitante = resolverUsuario(usuarioDetails, authentication);
        PaginacionValidator.validar(pageable, SolicitudConsultaService.SORT_WHITELIST);
        Page<SolicitudResumenResponse> response = solicitudConsultaService.listarMisSolicitudes(solicitante, estado, q, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Consulta el detalle completo de una solicitud (REG-12 / RN-16 / CA-12 / CA-13).
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Obtener detalle de solicitud",
            description = "Consulta la información detallada de una solicitud, sus evidencias adjuntas y las acciones permitidas según el alcance del usuario."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Detalle de la solicitud",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance del usuario")
    })
    public ResponseEntity<SolicitudDetalleResponse> obtenerDetalle(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario usuario = resolverUsuario(usuarioDetails, authentication);
        SolicitudDetalleResponse response = solicitudConsultaService.obtenerDetalle(id, usuario);
        return ResponseEntity.ok(response);
    }

    /**
     * Consulta la línea de tiempo cronológica inmutable de una solicitud (REG-12).
     */
    @GetMapping("/{id}/historial")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Obtener historial de solicitud",
            description = "Retorna la bitácora inmutable de cambios de estado y notas de auditoría de la solicitud."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista ordenada cronológicamente de transiciones"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance del usuario")
    })
    public ResponseEntity<List<HistorialItemResponse>> obtenerHistorial(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario usuario = resolverUsuario(usuarioDetails, authentication);
        List<HistorialItemResponse> response = solicitudConsultaService.obtenerHistorial(id, usuario);
        return ResponseEntity.ok(response);
    }

    /**
     * Descarga autenticada de evidencia adjunta con validación de alcance (REG-12 / RN-16).
     */
    @GetMapping("/{id}/evidencias/{idEvidencia}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Descargar archivo de evidencia",
            description = "Descarga el archivo binario de una evidencia adjunta tras validar que la solicitud pertenece al alcance del usuario autenticado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contenido binario del archivo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Evidencia o solicitud no encontrada / fuera de alcance")
    })
    public ResponseEntity<byte[]> descargarEvidencia(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @Parameter(description = "ID de la evidencia adjunta", example = "1")
            @PathVariable Long idEvidencia,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario usuario = resolverUsuario(usuarioDetails, authentication);
        SolicitudConsultaService.EvidenciaDescarga descarga = solicitudConsultaService.descargarEvidencia(id, idEvidencia, usuario);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (descarga.mimeType() != null) {
                mediaType = MediaType.parseMediaType(descarga.mimeType());
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + descarga.nombreOriginal() + "\"")
                .body(descarga.contenido());
    }

    /**
     * Consulta la bandeja general de solicitudes con filtros y alcance por rol (GES-09 / RF-12 / CA-16).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TECNICO', 'SUPERVISOR', 'ADMIN')")
    @Operation(
            summary = "Listar bandeja operativa de solicitudes",
            description = "Consulta la bandeja general con filtros por estado, prioridad, categoría, técnico, rango de fechas y vencimiento SLA. El alcance se restringe automáticamente según el rol del usuario."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Página de solicitudes en bandeja operativa"),
            @ApiResponse(responseCode = "400", description = "Parámetros de filtrado o paginación inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Acceso denegado (estudiantes no tienen acceso a la bandeja operativa)")
    })
    public ResponseEntity<Page<SolicitudResumenResponse>> listarBandeja(
            @Parameter(description = "Lista de códigos de estado a filtrar")
            @RequestParam(value = "estado", required = false) List<String> estados,
            @Parameter(description = "ID de prioridad")
            @RequestParam(value = "idPrioridad", required = false) Integer idPrioridad,
            @Parameter(description = "ID de categoría")
            @RequestParam(value = "idCategoria", required = false) Integer idCategoria,
            @Parameter(description = "ID de técnico asignado")
            @RequestParam(value = "idTecnico", required = false) Long idTecnico,
            @Parameter(description = "Texto a buscar en código o título")
            @RequestParam(value = "q", required = false) String q,
            @Parameter(description = "Fecha inicial de registro (ISO DATE_TIME)")
            @RequestParam(value = "desde", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @Parameter(description = "Fecha final de registro (ISO DATE_TIME)")
            @RequestParam(value = "hasta", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta,
            @Parameter(description = "Filtrar únicamente solicitudes con SLA vencido")
            @RequestParam(value = "vencidas", required = false) Boolean vencidas,
            @PageableDefault(size = 20, sort = "fechaRegistro", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario usuario = resolverUsuario(usuarioDetails, authentication);
        PaginacionValidator.validar(pageable, SolicitudConsultaService.SORT_WHITELIST);
        Page<SolicitudResumenResponse> response = solicitudConsultaService.listarBandeja(
                usuario, estados, idPrioridad, idCategoria, idTecnico, q, desde, hasta, vencidas, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Evalúa una solicitud en REGISTRADA pasando a EN_EVALUACION (GES-11 / US-23 / CA-6).
     */
    @PutMapping("/{id}/evaluar")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    @Operation(
            summary = "Evaluar solicitud",
            description = "Permite al supervisor del área o administrador evaluar una solicitud en estado REGISTRADA, pasando a EN_EVALUACION con ajuste opcional de prioridad y recálculo de SLA."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitud evaluada con éxito",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos (ej. prioridad no válida o nota con HTML)"),
            @ApiResponse(responseCode = "401", description = "No autenticado o credenciales inválidas"),
            @ApiResponse(responseCode = "403", description = "No autorizado (no pertenece al área de la solicitud ni es admin)"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance"),
            @ApiResponse(responseCode = "409", description = "Transición inválida (la solicitud no está en estado REGISTRADA)")
    })
    public ResponseEntity<SolicitudDetalleResponse> evaluar(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @Valid @RequestBody(required = false) SolicitudEvaluarRequest request,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario actor = resolverUsuario(usuarioDetails, authentication);
        Integer idPrioridad = request != null ? request.idPrioridad() : null;
        String nota = request != null ? request.nota() : null;
        SolicitudDetalleResponse response = solicitudWorkflowService.evaluar(id, idPrioridad, nota, actor);
        return ResponseEntity.ok(response);
    }

    /**
     * Asigna o reasigna un técnico operativo a la solicitud (GES-06 / US-08 / CA-1 / CA-4 / CA-8).
     */
    @PutMapping("/{id}/asignar")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    @Operation(
            summary = "Asignar o reasignar técnico",
            description = "Asigna o reasigna un técnico del área responsable a la solicitud, transicionando a ASIGNADA y registrando la nota en el historial."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Técnico asignado exitosamente",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Técnico inactivo o perteneciente a otra área"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado (no es supervisor del área ni admin)"),
            @ApiResponse(responseCode = "404", description = "Solicitud o técnico no encontrado"),
            @ApiResponse(responseCode = "409", description = "Estado actual no permite asignación")
    })
    public ResponseEntity<SolicitudDetalleResponse> asignar(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @Valid @RequestBody SolicitudAsignarRequest request,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario actor = resolverUsuario(usuarioDetails, authentication);
        SolicitudDetalleResponse response = solicitudWorkflowService.asignar(id, request, actor);
        return ResponseEntity.ok(response);
    }

    /**
     * Marca el inicio de atención operativa por parte del técnico asignado o admin (GES-07 / US-09 / CA-9).
     */
    @PutMapping("/{id}/iniciar-atencion")
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    @Operation(
            summary = "Iniciar atención operativa",
            description = "Transiciona la solicitud de ASIGNADA a EN_ATENCION y registra la fecha de inicio de intervención técnica."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Atención iniciada con éxito",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Solo el técnico asignado o un administrador pueden iniciar atención"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance"),
            @ApiResponse(responseCode = "409", description = "La solicitud no se encuentra en estado ASIGNADA")
    })
    public ResponseEntity<SolicitudDetalleResponse> iniciarAtencion(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario actor = resolverUsuario(usuarioDetails, authentication);
        SolicitudDetalleResponse response = solicitudWorkflowService.iniciarAtencion(id, actor);
        return ResponseEntity.ok(response);
    }

    /**
     * Resuelve la solicitud requiriendo informe técnico y entre 1 y 3 evidencias (GES-08 / US-10 / CA-10 / CA-11).
     */
    @PutMapping(value = "/{id}/resolver", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    @Operation(
            summary = "Resolver solicitud",
            description = "Transiciona de EN_ATENCION a RESUELTA requiriendo informe técnico explicativo (mínimo 20 caracteres) y entre 1 y 3 archivos de evidencia."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitud resuelta con éxito",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Informe menor a 20 caracteres o cantidad de evidencias no permitida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Solo el técnico asignado o un administrador pueden resolver la solicitud"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance"),
            @ApiResponse(responseCode = "409", description = "La solicitud no se encuentra en estado EN_ATENCION"),
            @ApiResponse(responseCode = "413", description = "Un archivo adjunto excede los 5 MB"),
            @ApiResponse(responseCode = "415", description = "Formato de archivo no permitido")
    })
    public ResponseEntity<SolicitudDetalleResponse> resolver(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @Valid @RequestPart("datos") SolicitudResolverRequest datos,
            @RequestPart(value = "archivos", required = false) List<MultipartFile> archivos,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario actor = resolverUsuario(usuarioDetails, authentication);
        SolicitudDetalleResponse response = solicitudWorkflowService.resolver(id, datos, archivos, actor);
        return ResponseEntity.ok(response);
    }

    /**
     * Cierra formalmente una solicitud RESUELTA pasando a CERRADA (GES-13 / US-25 / CA-14).
     */
    @PutMapping("/{id}/cerrar")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Cerrar solicitud",
            description = "Cierra formalmente una solicitud en estado RESUELTA pasando a CERRADA y registrando la fecha de cierre. Puede ser ejecutado por el usuario solicitante, el supervisor del área o el administrador."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitud cerrada con éxito",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SolicitudDetalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Nota de cierre inválida o con HTML"),
            @ApiResponse(responseCode = "401", description = "No autenticado o credenciales inválidas"),
            @ApiResponse(responseCode = "403", description = "No autorizado (no es el solicitante, supervisor del área ni admin)"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada o fuera del alcance"),
            @ApiResponse(responseCode = "409", description = "Transición inválida (la solicitud no se encuentra en estado RESUELTA)")
    })
    public ResponseEntity<SolicitudDetalleResponse> cerrar(
            @Parameter(description = "ID único de la solicitud", example = "150")
            @PathVariable Long id,
            @Valid @RequestBody(required = false) SolicitudCerrarRequest request,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario actor = resolverUsuario(usuarioDetails, authentication);
        String nota = request != null ? request.nota() : null;
        SolicitudDetalleResponse response = solicitudWorkflowService.cerrar(id, nota, actor);
        return ResponseEntity.ok(response);
    }

    private Usuario resolverUsuario(UsuarioDetails usuarioDetails, Authentication authentication) {
        if (usuarioDetails != null && usuarioDetails.getUsuario() != null) {
            return usuarioDetails.getUsuario();
        }
        if (authentication != null) {
            if (authentication.getPrincipal() instanceof UsuarioDetails ud) {
                return ud.getUsuario();
            }
            if (authentication.getPrincipal() instanceof Usuario u) {
                return u;
            }
        }
        Authentication secAuth = SecurityContextHolder.getContext().getAuthentication();
        if (secAuth != null) {
            if (secAuth.getPrincipal() instanceof UsuarioDetails ud) {
                return ud.getUsuario();
            }
            if (secAuth.getPrincipal() instanceof Usuario u) {
                return u;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No está autenticado o sus credenciales son inválidas.");
    }
}
