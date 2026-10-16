package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Reglas de autorización y control de acceso por alcance de datos (RN-16 / GES-02 / REG-12).
 *
 * <p>Determina si un usuario autenticado puede ver una solicitud o ejecutar acciones sobre ella,
 * previniendo vulnerabilidades IDOR y calculando las {@code accionesPermitidas} para el frontend.</p>
 */
@Component
public class AccessPolicy {

    /**
     * Evalúa si un actor tiene visibilidad sobre una solicitud (RN-16).
     *
     * @param actor     Usuario que realiza la consulta.
     * @param solicitud Solicitud a consultar.
     * @return {@code true} si puede verla, {@code false} en caso contrario.
     */
    public boolean puedeVer(Usuario actor, Solicitud solicitud) {
        if (actor == null || solicitud == null || actor.getId() == null) {
            return false;
        }

        String rol = normalizarRol(actor);
        if ("ADMIN".equals(rol)) {
            return true;
        }

        if (esSolicitante(actor, solicitud)) {
            return true;
        }

        if ("TECNICO".equals(rol)) {
            return esTecnicoAsignado(actor, solicitud);
        }

        if ("SUPERVISOR".equals(rol)) {
            return perteneceMismaArea(actor, solicitud);
        }

        return false;
    }

    /**
     * Determina si el actor es el creador original de la solicitud.
     */
    public boolean esSolicitante(Usuario actor, Solicitud solicitud) {
        if (actor == null || solicitud == null || solicitud.getSolicitante() == null) {
            return false;
        }
        return actor.getId().equals(solicitud.getSolicitante().getId());
    }

    /**
     * Determina si el actor es el técnico actualmente asignado a la solicitud.
     */
    public boolean esTecnicoAsignado(Usuario actor, Solicitud solicitud) {
        if (actor == null || solicitud == null || solicitud.getTecnicoAsignado() == null) {
            return false;
        }
        return actor.getId().equals(solicitud.getTecnicoAsignado().getId());
    }

    /**
     * Determina si el supervisor pertenece al área responsable de la categoría de la solicitud.
     */
    public boolean perteneceMismaArea(Usuario actor, Solicitud solicitud) {
        if (actor == null || solicitud == null || actor.getArea() == null) {
            return false;
        }
        if (solicitud.getCategoria() == null || solicitud.getCategoria().getArea() == null) {
            return false;
        }
        return actor.getArea().getId() != null
                && actor.getArea().getId().equals(solicitud.getCategoria().getArea().getId());
    }

    /**
     * Determina si el actor tiene los permisos requeridos para ejecutar una transición específica (GES-02).
     *
     * @param actor      Usuario que intenta realizar la transición.
     * @param solicitud  Solicitud sobre la cual se ejecutará la transición.
     * @param transicion Transición solicitada.
     * @return {@code true} si tiene permisos según rol y alcance de datos, {@code false} en caso contrario.
     */
    public boolean puedeEjecutar(Usuario actor, Solicitud solicitud, edu.universidad.servicios.solicitud.domain.Transicion transicion) {
        if (actor == null || solicitud == null || transicion == null) {
            return false;
        }

        String rol = normalizarRol(actor);
        boolean esAdmin = "ADMIN".equals(rol);
        boolean esSupervisorArea = "SUPERVISOR".equals(rol) && perteneceMismaArea(actor, solicitud);
        boolean esTecnicoAsignado = "TECNICO".equals(rol) && esTecnicoAsignado(actor, solicitud);
        boolean esDueno = esSolicitante(actor, solicitud);

        return switch (transicion) {
            case EVALUAR, ASIGNAR, REASIGNAR -> esAdmin || esSupervisorArea;
            case INICIAR_ATENCION, RESOLVER -> esAdmin || esTecnicoAsignado;
            case CERRAR -> esAdmin || esSupervisorArea || esDueno;
        };
    }

    /**
     * Calcula la lista de acciones que el actor tiene permitido ejecutar sobre la solicitud (GES-02).
     */
    public List<String> accionesPermitidas(Usuario actor, Solicitud solicitud) {
        if (!puedeVer(actor, solicitud)) {
            return List.of();
        }

        String estado = (solicitud.getEstado() != null) ? solicitud.getEstado().getCodigo() : "";
        List<String> acciones = new ArrayList<>();

        if (edu.universidad.servicios.solicitud.domain.Transicion.EVALUAR.esOrigenValido(estado)
                && puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.EVALUAR)) {
            acciones.add("EVALUAR");
        }

        if ((edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR.esOrigenValido(estado)
                || edu.universidad.servicios.solicitud.domain.Transicion.REASIGNAR.esOrigenValido(estado))
                && (puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR)
                || puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.REASIGNAR))) {
            acciones.add("ASIGNAR");
        }

        if (edu.universidad.servicios.solicitud.domain.Transicion.INICIAR_ATENCION.esOrigenValido(estado)
                && puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.INICIAR_ATENCION)) {
            acciones.add("INICIAR_ATENCION");
        }

        if (edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER.esOrigenValido(estado)
                && puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER)) {
            acciones.add("RESOLVER");
        }

        if (edu.universidad.servicios.solicitud.domain.Transicion.CERRAR.esOrigenValido(estado)
                && puedeEjecutar(actor, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)) {
            acciones.add("CERRAR");
        }

        // COMENTAR: cualquier solicitud no final (no CERRADA)
        if (!"CERRADA".equals(estado)) {
            acciones.add("COMENTAR");
        }

        return acciones;
    }

    private String normalizarRol(Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getNombre() == null) {
            return "";
        }
        return usuario.getRol().getNombre().toUpperCase().replace("ROLE_", "").trim();
    }
}
