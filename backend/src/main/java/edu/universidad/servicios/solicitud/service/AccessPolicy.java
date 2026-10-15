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
     * Calcula la lista de acciones que el actor tiene permitido ejecutar sobre la solicitud (GES-02).
     */
    public List<String> accionesPermitidas(Usuario actor, Solicitud solicitud) {
        if (!puedeVer(actor, solicitud)) {
            return List.of();
        }

        String rol = normalizarRol(actor);
        String estado = (solicitud.getEstado() != null) ? solicitud.getEstado().getCodigo() : "";
        List<String> acciones = new ArrayList<>();

        boolean esAdmin = "ADMIN".equals(rol);
        boolean esSupervisorArea = "SUPERVISOR".equals(rol) && perteneceMismaArea(actor, solicitud);
        boolean esTecnico = "TECNICO".equals(rol) && esTecnicoAsignado(actor, solicitud);
        boolean esDueno = esSolicitante(actor, solicitud);

        // EVALUAR: REGISTRADA (Supervisor del área o Admin)
        if ("REGISTRADA".equals(estado) && (esAdmin || esSupervisorArea)) {
            acciones.add("EVALUAR");
        }

        // ASIGNAR / REASIGNAR: REGISTRADA, EN_EVALUACION, ASIGNADA, EN_ATENCION (Supervisor del área o Admin)
        if (List.of("REGISTRADA", "EN_EVALUACION", "ASIGNADA", "EN_ATENCION").contains(estado)
                && (esAdmin || esSupervisorArea)) {
            acciones.add("ASIGNAR");
        }

        // INICIAR_ATENCION: ASIGNADA (Técnico asignado o Admin)
        if ("ASIGNADA".equals(estado) && (esAdmin || esTecnico)) {
            acciones.add("INICIAR_ATENCION");
        }

        // RESOLVER: EN_ATENCION (Técnico asignado o Admin)
        if ("EN_ATENCION".equals(estado) && (esAdmin || esTecnico)) {
            acciones.add("RESOLVER");
        }

        // CERRAR: RESUELTA (Solicitante, Supervisor del área o Admin)
        if ("RESUELTA".equals(estado) && (esDueno || esAdmin || esSupervisorArea)) {
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
