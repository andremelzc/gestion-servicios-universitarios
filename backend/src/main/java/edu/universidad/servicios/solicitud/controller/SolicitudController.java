package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudCreadaResponse;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Usuario;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
 * Controlador REST para la gestión y registro de solicitudes (REG-09 / Issue #42).
 */
@RestController
@RequestMapping("/api/v1/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;

    /**
     * Registra una nueva solicitud de servicio con evidencias adjuntas (REG-09 / Issue #42).
     *
     * <p>Endpoint multipart/form-data que recibe:</p>
     * <ul>
     *   <li>{@code solicitud}: JSON con los campos de la solicitud (validado con Bean Validation).</li>
     *   <li>{@code archivos}: 0 a 3 evidencias opcionales (JPG, PNG, PDF &le; 5 MB).</li>
     * </ul>
     *
     * @param request        Datos de la solicitud deserializados y validados desde el part "solicitud".
     * @param archivos       Lista opcional de archivos adjuntos desde el part "archivos".
     * @param usuarioDetails Usuario autenticado inyectado por Spring Security.
     * @param authentication Contexto de autenticación para resolución de fallback.
     * @return {@code 201 Created} con cabecera {@code Location: /api/v1/solicitudes/{id}} y datos de la solicitud creada.
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
