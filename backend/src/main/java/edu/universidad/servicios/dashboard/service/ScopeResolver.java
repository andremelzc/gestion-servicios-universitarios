package edu.universidad.servicios.dashboard.service;

import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ScopeResolver {

    public DashboardScope resolve(Usuario actor, Integer idAreaSolicitada) {
        if (actor == null || actor.getRol() == null || actor.getRol().getNombre() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No está autenticado o sus credenciales son inválidas.");
        }
        if (!Boolean.TRUE.equals(actor.getActivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no está activo");
        }

        String rol = actor.getRol().getNombre();
        if (rol.startsWith("ROLE_")) {
            rol = rol.substring("ROLE_".length());
        }
        return switch (rol) {
            case "ADMIN" -> new DashboardScope(idAreaSolicitada, null);
            case "SUPERVISOR" -> {
                if (actor.getArea() == null || actor.getArea().getId() == null) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El supervisor no tiene área asignada");
                }
                yield new DashboardScope(actor.getArea().getId(), null);
            }
            case "TECNICO" -> {
                if (actor.getId() == null) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El técnico no tiene identificador");
                }
                yield new DashboardScope(null, actor.getId());
            }
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene acceso al dashboard");
        };
    }
}
