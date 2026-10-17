package edu.universidad.servicios.usuario.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.TecnicoResponse;
import edu.universidad.servicios.usuario.service.UsuarioService;
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
 * Controlador para la gestión y consulta de usuarios (GES-10 / CA-17 / Admin 2.5).
 */
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Consulta técnicos activos con su carga actual de trabajo.
     * Permitido para SUPERVISOR (área forzada) y ADMIN (filtro opcional por área).
     */
    @GetMapping("/tecnicos")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<TecnicoResponse>> listarTecnicos(
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
