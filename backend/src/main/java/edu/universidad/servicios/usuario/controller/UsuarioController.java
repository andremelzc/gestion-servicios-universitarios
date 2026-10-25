package edu.universidad.servicios.usuario.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.TecnicoResponse;
import edu.universidad.servicios.usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Controlador para la gestión y consulta de usuarios (GES-10 / CA-17 / Admin 2.5 / OPS-28).
 */
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Endpoints de consulta de personal técnico y usuarios")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Consulta técnicos activos con su carga actual de trabajo.
     * Permitido para SUPERVISOR (área forzada) y ADMIN (filtro opcional por área).
     */
    @GetMapping("/tecnicos")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    @Operation(
            summary = "Listar técnicos operativos",
            description = "Consulta la lista de técnicos activos con su carga de trabajo actual (solicitudes pendientes asignadas). Para supervisores, restringe automáticamente al área del supervisor."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listado de técnicos obtenido con éxito"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado (solo supervisores y administradores)")
    })
    public ResponseEntity<List<TecnicoResponse>> listarTecnicos(
            @Parameter(description = "ID del área (opcional para ADMIN)")
            @RequestParam(value = "idArea", required = false) Integer idArea,
            Authentication authentication
    ) {
        Usuario actor = getUsuarioAutenticado(authentication);
        List<TecnicoResponse> tecnicos = usuarioService.listarTecnicos(actor, idArea);
        return ResponseEntity.ok(tecnicos);
    }

    private Usuario getUsuarioAutenticado(Authentication authentication) {
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
