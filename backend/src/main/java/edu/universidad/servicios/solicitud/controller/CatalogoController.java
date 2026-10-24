package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.solicitud.dto.CategoriaResponse;
import edu.universidad.servicios.solicitud.dto.PrioridadResponse;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Catálogos", description = "Endpoints de consulta para catálogos maestros y activos")
public class CatalogoController {

    private final CategoriaRepository categoriaRepository;
    private final PrioridadRepository prioridadRepository;

    /**
     * Retorna el catálogo de categorías activas para el formulario de solicitud (REG-14 / Issue #44).
     * Permite filtrar opcionalmente por área responsable mediante {@code ?idArea=}.
     */
    @GetMapping("/categorias")
    @Operation(
            summary = "Listar categorías activas",
            description = "Retorna el listado de categorías activas para el registro de solicitudes, con filtro opcional por área."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listado de categorías obtenido exitosamente")
    })
    public ResponseEntity<List<CategoriaResponse>> listarCategorias(
            @Parameter(description = "ID del área para filtrar categorías")
            @RequestParam(required = false) Integer idArea
    ) {
        List<CategoriaResponse> categorias = (idArea != null)
                ? categoriaRepository.findByAreaIdAndActivoTrueOrderByNombreAsc(idArea)
                .stream()
                .map(CategoriaResponse::de)
                .toList()
                : categoriaRepository.findByActivoTrueOrderByNombreAsc()
                .stream()
                .map(CategoriaResponse::de)
                .toList();

        return ResponseEntity.ok(categorias);
    }

    /**
     * Retorna el catálogo de prioridades activas ordenadas por ponderador ascendente (REG-14 / Issue #44).
     */
    @GetMapping("/prioridades")
    @Operation(
            summary = "Listar prioridades activas",
            description = "Retorna el catálogo de prioridades activas ordenadas por ponderador ascendente con su tiempo máximo SLA."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listado de prioridades obtenido exitosamente")
    })
    public ResponseEntity<List<PrioridadResponse>> listarPrioridades() {
        List<PrioridadResponse> prioridades = prioridadRepository.findByActivoTrueOrderByPonderadorAsc()
                .stream()
                .map(PrioridadResponse::de)
                .toList();

        return ResponseEntity.ok(prioridades);
    }
}
