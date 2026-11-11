package edu.universidad.servicios.usuario.controller;

import edu.universidad.servicios.usuario.repository.RolRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/roles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RolController {
    private final RolRepository roles;
    public record RolResponse(Integer id, String nombre, String descripcion) {}
    @GetMapping
    public List<RolResponse> listar() {
        return roles.findAll(Sort.by("id")).stream()
            .map(r -> new RolResponse(r.getId(), r.getNombre().replaceFirst("^ROLE_", ""), r.getDescripcion())).toList();
    }
}
