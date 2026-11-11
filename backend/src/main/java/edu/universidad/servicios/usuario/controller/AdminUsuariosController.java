package edu.universidad.servicios.usuario.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.usuario.dto.*;
import edu.universidad.servicios.usuario.service.AdminUsuarioService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/usuarios")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUsuariosController {
    private final AdminUsuarioService servicio;

    @GetMapping
    public AdminUsuarioService.Pagina<UsuarioAdminResponse> listar(
        @RequestParam(required = false) String rol, @RequestParam(required = false) Integer idArea,
        @RequestParam(required = false) Boolean activo, @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return servicio.listar(rol, idArea, activo, q, page, size);
    }

    @GetMapping("/{id}")
    public UsuarioAdminResponse obtener(@PathVariable Long id) { return servicio.obtener(id); }

    @PostMapping
    public ResponseEntity<UsuarioAdminResponse> crear(@Valid @RequestBody UsuarioCrearRequest datos,
        @AuthenticationPrincipal UsuarioDetails actor) {
        var creado = servicio.crear(datos, actor.getUsuario().getId());
        return ResponseEntity.created(URI.create("/api/v1/admin/usuarios/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public UsuarioAdminResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioActualizarRequest datos,
        @AuthenticationPrincipal UsuarioDetails actor) {
        return servicio.actualizar(id, datos, actor.getUsuario().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desactivar(@PathVariable Long id, @AuthenticationPrincipal UsuarioDetails actor) {
        servicio.desactivar(id, actor.getUsuario().getId());
    }

    @PutMapping("/{id}/reactivar")
    public UsuarioAdminResponse reactivar(@PathVariable Long id, @AuthenticationPrincipal UsuarioDetails actor) {
        return servicio.reactivar(id, actor.getUsuario().getId());
    }
}
