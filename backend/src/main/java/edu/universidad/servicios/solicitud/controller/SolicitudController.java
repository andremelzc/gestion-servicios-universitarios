package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.solicitud.dto.*;
import edu.universidad.servicios.solicitud.service.SolicitudConsultaService;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Usuario;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;

/**
 * Controlador REST para el registro, consulta y detalle de solicitudes (REG-09 / REG-11 / REG-12).
 */
@RestController
@RequestMapping("/api/v1/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final SolicitudConsultaService solicitudConsultaService;

    /**
     * Registra una nueva solicitud de servicio con evidencias adjuntas (REG-09 / Issue #42).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
     *
     * @param estado         Filtro opcional por código de estado (ej: CERRADA, REGISTRADA).
     * @param q              Búsqueda opcional en código, título o descripción.
     * @param pageable       Paginación y ordenamiento con lista blanca de campos.
     * @param usuarioDetails Usuario autenticado.
     * @param authentication Fallback de autenticación.
     * @return Página de {@link SolicitudResumenResponse}.
     */
    @GetMapping("/mis-solicitudes")
    public ResponseEntity<Page<SolicitudResumenResponse>> misSolicitudes(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "fechaRegistro", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        Usuario solicitante = resolverUsuario(usuarioDetails, authentication);
        Page<SolicitudResumenResponse> response = solicitudConsultaService.listarMisSolicitudes(solicitante, estado, q, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Consulta el detalle completo de una solicitud (REG-12 / RN-16 / CA-12 / CA-13).
     * Devuelve 404 si la solicitud no existe o está fuera del alcance del usuario.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SolicitudDetalleResponse> obtenerDetalle(
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
    public ResponseEntity<List<HistorialItemResponse>> obtenerHistorial(
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
    public ResponseEntity<byte[]> descargarEvidencia(
            @PathVariable Long id,
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
