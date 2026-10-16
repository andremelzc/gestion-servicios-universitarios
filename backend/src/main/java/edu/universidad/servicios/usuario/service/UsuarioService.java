package edu.universidad.servicios.usuario.service;

import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.TecnicoResponse;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio de gestión de usuarios y consulta de técnicos con cálculo de carga actual (GES-10 / CA-17).
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SolicitudRepository solicitudRepository;

    /**
     * Lista los técnicos activos filtrados por área, calculando su carga de trabajo actual.
     * Si el actor es SUPERVISOR, se fuerza su propia área ignorando cualquier parámetro externo.
     * Si el actor es ADMIN, se respeta el filtro de área proporcionado (o todos si es nulo).
     * Otros roles reciben 403 Forbidden.
     */
    @Transactional(readOnly = true)
    public List<TecnicoResponse> listarTecnicos(Usuario actor, Integer idAreaFiltro) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }

        String rol = normalizarRol(actor);
        Integer areaConsulta;

        if ("SUPERVISOR".equals(rol)) {
            if (actor.getArea() == null || actor.getArea().getId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El supervisor no tiene área asignada");
            }
            areaConsulta = actor.getArea().getId();
        } else if ("ADMIN".equals(rol)) {
            areaConsulta = idAreaFiltro;
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene permisos para consultar técnicos");
        }

        List<Usuario> tecnicos = usuarioRepository.findTecnicosActivosPorArea(areaConsulta);
        if (tecnicos.isEmpty()) {
            return List.of();
        }

        List<Long> ids = tecnicos.stream().map(Usuario::getId).toList();
        List<Object[]> conteos = solicitudRepository.countCargasActualesPorTecnicos(ids);

        Map<Long, Long> cargaPorTecnico = new HashMap<>();
        if (conteos != null) {
            for (Object[] fila : conteos) {
                if (fila != null && fila.length >= 2 && fila[0] != null && fila[1] != null) {
                    Long tecId = ((Number) fila[0]).longValue();
                    Long cantidad = ((Number) fila[1]).longValue();
                    cargaPorTecnico.put(tecId, cantidad);
                }
            }
        }

        return tecnicos.stream().map(t -> new TecnicoResponse(
                t.getId(),
                t.getCodigoInstitucional(),
                t.getNombre(),
                t.getApellido(),
                t.getCorreo(),
                t.getTelefono(),
                t.getArea() != null ? t.getArea().getId() : null,
                t.getArea() != null ? t.getArea().getNombre() : null,
                t.getActivo(),
                cargaPorTecnico.getOrDefault(t.getId(), 0L)
        )).toList();
    }

    private String normalizarRol(Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getNombre() == null) {
            return "";
        }
        return usuario.getRol().getNombre().toUpperCase().replace("ROLE_", "").trim();
    }
}
