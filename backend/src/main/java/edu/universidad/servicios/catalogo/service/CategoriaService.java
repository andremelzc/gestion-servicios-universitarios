package edu.universidad.servicios.catalogo.service;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoriaService {

    private final CategoriaRepository categorias;
    private final AreaRepository areas;

    @Transactional(readOnly = true)
    public List<Categoria> listar(boolean incluirInactivos, Integer idArea) {
        return categorias
            .findAll()
            .stream()
            .filter(c -> incluirInactivos || Boolean.TRUE.equals(c.getActivo()))
            .filter(
                c ->
                    idArea == null ||
                    Objects.equals(c.getArea().getId(), idArea)
            )
            .sorted(
                Comparator.comparing(
                    Categoria::getNombre,
                    String.CASE_INSENSITIVE_ORDER
                )
            )
            .toList();
    }

    @Transactional(readOnly = true)
    public Categoria obtener(Integer id) {
        return categorias
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Categoría no encontrada"
                )
            );
    }

    public Categoria crear(
        String nombre,
        String descripcion,
        Integer idArea,
        Integer tiempoSlaHoras
    ) {
        Categoria categoria = new Categoria();
        aplicar(categoria, nombre, descripcion, idArea, tiempoSlaHoras);
        categoria.setActivo(true);
        return categorias.save(categoria);
    }

    public Categoria actualizar(
        Integer id,
        String nombre,
        String descripcion,
        Integer idArea,
        Integer tiempoSlaHoras
    ) {
        Categoria categoria = obtenerParaActualizar(id);
        aplicar(categoria, nombre, descripcion, idArea, tiempoSlaHoras);
        return categorias.save(categoria);
    }

    public void desactivar(Integer id) {
        Categoria categoria = obtenerParaActualizar(id);
        categoria.setActivo(false);
        categorias.save(categoria);
    }

    public Categoria reactivar(Integer id) {
        Categoria categoria = obtenerParaActualizar(id);
        Area area = bloquearArea(categoria.getArea().getId());
        if (!Boolean.TRUE.equals(area.getActivo())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El área debe estar activa para reactivar la categoría"
            );
        }
        categoria.setActivo(true);
        return categorias.save(categoria);
    }

    private Categoria obtenerParaActualizar(Integer id) {
        return categorias
            .findByIdForUpdate(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Categoría no encontrada"
                )
            );
    }

    private Area bloquearArea(Integer id) {
        return areas
            .findByIdForUpdate(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Área inexistente"
                )
            );
    }

    private void aplicar(
        Categoria categoria,
        String nombre,
        String descripcion,
        Integer idArea,
        Integer sla
    ) {
        if (
            nombre == null ||
            nombre.isBlank() ||
            nombre.trim().length() > 80 ||
            (descripcion != null && descripcion.length() > 255) ||
            idArea == null ||
            sla == null ||
            sla < 1
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Datos de categoría inválidos"
            );
        }
        String nombreNormalizado = nombre.trim();
        if (
            categorias
                .findByNombreIgnoreCase(nombreNormalizado)
                .filter(c -> !Objects.equals(c.getId(), categoria.getId()))
                .isPresent()
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe una categoría con ese nombre"
            );
        }
        Integer origen =
            categoria.getArea() == null ? null : categoria.getArea().getId();
        Area area;
        // Bloquear siempre en orden ascendente evita ciclos entre reasignaciones opuestas.
        if (origen != null && origen < idArea) {
            bloquearArea(origen);
            area = bloquearArea(idArea);
        } else {
            area = bloquearArea(idArea);
            if (origen != null && origen > idArea) {
                bloquearArea(origen);
            }
        }
        if (!Boolean.TRUE.equals(area.getActivo())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El área debe estar activa"
            );
        }
        categoria.setNombre(nombreNormalizado);
        categoria.setDescripcion(descripcion);
        categoria.setArea(area);
        categoria.setTiempoSlaHoras(sla);
    }
}
