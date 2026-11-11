package edu.universidad.servicios.catalogo.service;

import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
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
public class PrioridadService {

    private final PrioridadRepository prioridades;

    @Transactional(readOnly = true)
    public List<Prioridad> listar(boolean incluirInactivos) {
        return prioridades
            .findAll()
            .stream()
            .filter(p -> incluirInactivos || Boolean.TRUE.equals(p.getActivo()))
            .sorted(Comparator.comparing(Prioridad::getPonderador))
            .toList();
    }

    @Transactional(readOnly = true)
    public Prioridad obtener(Integer id) {
        return prioridades
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Prioridad no encontrada"
                )
            );
    }

    public Prioridad crear(
        String nivel,
        Integer ponderador,
        Integer slaMaxHoras
    ) {
        Prioridad prioridad = new Prioridad();
        aplicar(prioridad, nivel, ponderador, slaMaxHoras);
        prioridad.setActivo(true);
        return prioridades.save(prioridad);
    }

    public Prioridad actualizar(
        Integer id,
        String nivel,
        Integer ponderador,
        Integer slaMaxHoras
    ) {
        Prioridad prioridad = obtener(id);
        aplicar(prioridad, nivel, ponderador, slaMaxHoras);
        return prioridades.save(prioridad);
    }

    public void desactivar(Integer id) {
        Prioridad prioridad = obtener(id);
        prioridad.setActivo(false);
        prioridades.save(prioridad);
    }

    public Prioridad reactivar(Integer id) {
        Prioridad prioridad = obtener(id);
        prioridad.setActivo(true);
        return prioridades.save(prioridad);
    }

    private void aplicar(
        Prioridad prioridad,
        String nivel,
        Integer ponderador,
        Integer sla
    ) {
        if (
            nivel == null ||
            nivel.isBlank() ||
            nivel.trim().length() > 20 ||
            ponderador == null ||
            sla == null ||
            sla < 1
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Datos de prioridad inválidos"
            );
        }
        String normalizado = nivel.trim();
        if (
            prioridades
                .findByNivelIgnoreCase(normalizado)
                .filter(p -> !Objects.equals(p.getId(), prioridad.getId()))
                .isPresent()
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe una prioridad con ese nivel"
            );
        }
        prioridad.setNivel(normalizado);
        prioridad.setPonderador(ponderador);
        prioridad.setSlaMaxHoras(sla);
    }
}
