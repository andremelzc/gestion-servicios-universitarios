package edu.universidad.servicios.catalogo.service;

import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class AreaService {

    private static final Pattern CORREO = Pattern.compile(
        "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
    );
    private final AreaRepository areas;
    private final UsuarioRepository usuarios;

    @Transactional(readOnly = true)
    public List<Area> listar(boolean incluirInactivos) {
        return areas
            .findAll()
            .stream()
            .filter(a -> incluirInactivos || Boolean.TRUE.equals(a.getActivo()))
            .sorted(
                Comparator.comparing(
                    Area::getNombre,
                    String.CASE_INSENSITIVE_ORDER
                )
            )
            .toList();
    }

    @Transactional(readOnly = true)
    public Area obtener(Integer id) {
        return areas
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Área no encontrada"
                )
            );
    }

    public Area crear(String nombre, String correoContacto) {
        Area area = new Area();
        aplicar(area, nombre, correoContacto);
        area.setActivo(true);
        return areas.save(area);
    }

    public Area actualizar(Integer id, String nombre, String correoContacto) {
        Area area = obtener(id);
        aplicar(area, nombre, correoContacto);
        return areas.save(area);
    }

    public void desactivar(Integer id) {
        Area area = obtener(id);
        if (usuarios.existsByAreaIdAndActivoTrue(id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Reasigne o desactive los usuarios del área primero"
            );
        }
        area.setActivo(false);
        areas.save(area);
    }

    public Area reactivar(Integer id) {
        Area area = obtener(id);
        area.setActivo(true);
        return areas.save(area);
    }

    private void aplicar(Area area, String nombre, String correo) {
        if (
            nombre == null ||
            nombre.isBlank() ||
            nombre.trim().length() > 100 ||
            correo == null ||
            correo.length() > 100 ||
            !CORREO.matcher(correo).matches()
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Datos de área inválidos"
            );
        }
        String normalizado = nombre.trim();
        if (
            areas
                .findByNombreIgnoreCase(normalizado)
                .filter(a -> !Objects.equals(a.getId(), area.getId()))
                .isPresent()
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un área con ese nombre"
            );
        }
        area.setNombre(normalizado);
        area.setCorreoContacto(correo);
    }
}
