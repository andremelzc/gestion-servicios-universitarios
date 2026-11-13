package edu.universidad.servicios.catalogo.controller;

import edu.universidad.servicios.catalogo.service.AreaService;
import edu.universidad.servicios.catalogo.service.CategoriaService;
import edu.universidad.servicios.catalogo.service.EstadoService;
import edu.universidad.servicios.catalogo.service.PrioridadService;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.dto.CategoriaResponse;
import edu.universidad.servicios.solicitud.dto.PrioridadResponse;
import edu.universidad.servicios.usuario.domain.Area;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Catálogos", description = "Administración de catálogos")
public class AdministracionCatalogoController {

    private final AreaService areas;
    private final CategoriaService categorias;
    private final PrioridadService prioridades;
    private final EstadoService estados;

    public record AreaRequest(String nombre, String correoContacto) {}

    public record AreaResponse(
        Integer id,
        String nombre,
        String correoContacto,
        Boolean activo
    ) {
        static AreaResponse de(Area a) {
            return new AreaResponse(
                a.getId(),
                a.getNombre(),
                a.getCorreoContacto(),
                a.getActivo()
            );
        }
    }

    public record CategoriaRequest(
        String nombre,
        String descripcion,
        Integer idArea,
        Integer tiempoSlaHoras
    ) {}

    public record PrioridadRequest(
        String nivel,
        Integer ponderador,
        Integer slaMaxHoras
    ) {}

    public record EstadoRequest(
        String nombreVisible,
        String descripcion,
        String colorHex
    ) {}

    public record EstadoResponse(
        String codigo,
        String nombreVisible,
        String descripcion,
        String colorHex,
        Byte orden,
        Boolean esFinal
    ) {
        static EstadoResponse de(EstadoSolicitud e) {
            return new EstadoResponse(
                e.getCodigo(),
                e.getNombreVisible(),
                e.getDescripcion(),
                e.getColorHex(),
                e.getOrden(),
                e.getEsFinal()
            );
        }
    }

    private boolean admin(Authentication auth) {
        return (
            auth != null &&
            auth
                .getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
        );
    }

    private void visible(
        Boolean activo,
        boolean incluirInactivos,
        Authentication auth
    ) {
        if (
            !Boolean.TRUE.equals(activo) && !(incluirInactivos && admin(auth))
        ) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/areas")
    @Operation(summary = "Listar áreas")
    public List<AreaResponse> areas(
        @RequestParam(defaultValue = "false") boolean incluirInactivos,
        Authentication auth
    ) {
        return areas
            .listar(incluirInactivos && admin(auth))
            .stream()
            .map(AreaResponse::de)
            .toList();
    }

    @GetMapping("/areas/{id}")
    @Operation(summary = "Consultar área")
    public AreaResponse area(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "false") boolean incluirInactivos,
        Authentication auth
    ) {
        Area a = areas.obtener(id);
        visible(a.getActivo(), incluirInactivos, auth);
        return AreaResponse.de(a);
    }

    @PostMapping("/areas")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear área")
    public ResponseEntity<AreaResponse> crearArea(@RequestBody AreaRequest r) {
        AreaResponse a = AreaResponse.de(
            areas.crear(r.nombre(), r.correoContacto())
        );
        return ResponseEntity.created(
            URI.create("/api/v1/areas/" + a.id())
        ).body(a);
    }

    @PutMapping("/areas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar área")
    public AreaResponse actualizarArea(
        @PathVariable Integer id,
        @RequestBody AreaRequest r
    ) {
        return AreaResponse.de(
            areas.actualizar(id, r.nombre(), r.correoContacto())
        );
    }

    @DeleteMapping("/areas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar área")
    public ResponseEntity<Void> desactivarArea(@PathVariable Integer id) {
        areas.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/areas/{id}/reactivar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reactivar área")
    public AreaResponse reactivarArea(@PathVariable Integer id) {
        return AreaResponse.de(areas.reactivar(id));
    }

    @GetMapping("/categorias/{id}")
    @Transactional(readOnly = true)
    @Operation(summary = "Consultar categoría")
    public CategoriaResponse categoria(
        @PathVariable Integer id,
        @RequestParam(defaultValue = "false") boolean incluirInactivos,
        Authentication auth
    ) {
        var c = categorias.obtener(id);
        visible(c.getActivo(), incluirInactivos, auth);
        return CategoriaResponse.de(c);
    }

    @PostMapping("/categorias")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Crear categoría")
    public ResponseEntity<CategoriaResponse> crearCategoria(
        @RequestBody CategoriaRequest r
    ) {
        var c = CategoriaResponse.de(
            categorias.crear(
                r.nombre(),
                r.descripcion(),
                r.idArea(),
                r.tiempoSlaHoras()
            )
        );
        return ResponseEntity.created(
            URI.create("/api/v1/categorias/" + c.id())
        ).body(c);
    }

    @PutMapping("/categorias/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Actualizar categoría")
    public CategoriaResponse actualizarCategoria(
        @PathVariable Integer id,
        @RequestBody CategoriaRequest r
    ) {
        return CategoriaResponse.de(
            categorias.actualizar(
                id,
                r.nombre(),
                r.descripcion(),
                r.idArea(),
                r.tiempoSlaHoras()
            )
        );
    }

    @DeleteMapping("/categorias/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar categoría")
    public ResponseEntity<Void> desactivarCategoria(@PathVariable Integer id) {
        categorias.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/categorias/{id}/reactivar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Reactivar categoría")
    public CategoriaResponse reactivarCategoria(@PathVariable Integer id) {
        return CategoriaResponse.de(categorias.reactivar(id));
    }

    @PostMapping("/prioridades")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear prioridad")
    public ResponseEntity<PrioridadResponse> crearPrioridad(
        @RequestBody PrioridadRequest r
    ) {
        var p = PrioridadResponse.de(
            prioridades.crear(r.nivel(), r.ponderador(), r.slaMaxHoras())
        );
        return ResponseEntity.created(
            URI.create("/api/v1/prioridades/" + p.id())
        ).body(p);
    }

    @PutMapping("/prioridades/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar prioridad")
    public PrioridadResponse actualizarPrioridad(
        @PathVariable Integer id,
        @RequestBody PrioridadRequest r
    ) {
        return PrioridadResponse.de(
            prioridades.actualizar(
                id,
                r.nivel(),
                r.ponderador(),
                r.slaMaxHoras()
            )
        );
    }

    @DeleteMapping("/prioridades/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar prioridad")
    public ResponseEntity<Void> desactivarPrioridad(@PathVariable Integer id) {
        prioridades.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/prioridades/{id}/reactivar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reactivar prioridad")
    public PrioridadResponse reactivarPrioridad(@PathVariable Integer id) {
        return PrioridadResponse.de(prioridades.reactivar(id));
    }

    @GetMapping("/estados")
    @Operation(summary = "Listar estados")
    public List<EstadoResponse> estados() {
        return estados.listar().stream().map(EstadoResponse::de).toList();
    }

    @PutMapping("/estados/{codigo}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar presentación de estado")
    public EstadoResponse actualizarEstado(
        @PathVariable String codigo,
        @RequestBody EstadoRequest r
    ) {
        return EstadoResponse.de(
            estados.actualizarPresentacion(
                codigo,
                r.nombreVisible(),
                r.descripcion(),
                r.colorHex()
            )
        );
    }
}
