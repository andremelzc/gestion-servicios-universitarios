package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.solicitud.dto.ComentarioCrearRequest;
import edu.universidad.servicios.solicitud.dto.ComentarioResponse;
import edu.universidad.servicios.solicitud.service.ComentarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/solicitudes/{id}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {
    private final ComentarioService comentarioService;

    @GetMapping
    public List<ComentarioResponse> listar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioDetails principal) {
        return comentarioService.listar(id, principal.getUsuario());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComentarioResponse crear(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioDetails principal,
            @Valid @RequestBody ComentarioCrearRequest request) {
        return comentarioService.crear(id, principal.getUsuario(), request);
    }
}
