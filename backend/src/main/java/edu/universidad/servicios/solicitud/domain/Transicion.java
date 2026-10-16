package edu.universidad.servicios.solicitud.domain;

import java.util.Collections;
import java.util.Set;

/**
 * Máquina de estados oficial para solicitudes de servicio (GES-01 / Arquitectura §2.2).
 * Define los estados de origen válidos, el estado destino y los roles con permiso de ejecución.
 */
public enum Transicion {

    EVALUAR(
            Set.of("REGISTRADA"),
            "EN_EVALUACION",
            Set.of("SUPERVISOR", "ADMIN")
    ),

    ASIGNAR(
            Set.of("REGISTRADA", "EN_EVALUACION"),
            "ASIGNADA",
            Set.of("SUPERVISOR", "ADMIN")
    ),

    REASIGNAR(
            Set.of("ASIGNADA", "EN_ATENCION"),
            "ASIGNADA",
            Set.of("SUPERVISOR", "ADMIN")
    ),

    INICIAR_ATENCION(
            Set.of("ASIGNADA"),
            "EN_ATENCION",
            Set.of("TECNICO", "ADMIN")
    ),

    RESOLVER(
            Set.of("EN_ATENCION"),
            "RESUELTA",
            Set.of("TECNICO", "ADMIN")
    ),

    CERRAR(
            Set.of("RESUELTA"),
            "CERRADA",
            Set.of("ESTUDIANTE", "DOCENTE", "SUPERVISOR", "ADMIN")
    );

    private final Set<String> estadosOrigen;
    private final String estadoDestino;
    private final Set<String> rolesPermitidos;

    Transicion(Set<String> estadosOrigen, String estadoDestino, Set<String> rolesPermitidos) {
        this.estadosOrigen = Collections.unmodifiableSet(estadosOrigen);
        this.estadoDestino = estadoDestino;
        this.rolesPermitidos = Collections.unmodifiableSet(rolesPermitidos);
    }

    public Set<String> getEstadosOrigen() {
        return estadosOrigen;
    }

    public String getEstadoDestino() {
        return estadoDestino;
    }

    public Set<String> getRolesPermitidos() {
        return rolesPermitidos;
    }

    public boolean esOrigenValido(String estadoActual) {
        return estadoActual != null && estadosOrigen.contains(estadoActual);
    }

    public boolean permiteRol(String rol) {
        if (rol == null) {
            return false;
        }
        String normalizado = rol.toUpperCase().replace("ROLE_", "").trim();
        return rolesPermitidos.contains(normalizado);
    }

    /**
     * Resuelve si una operación de asignación corresponde a una asignación inicial (T3)
     * o a una reasignación (T6) según el estado actual de la solicitud.
     */
    public static Transicion resolverTransicionAsignacion(String estadoActual) {
        if ("REGISTRADA".equals(estadoActual) || "EN_EVALUACION".equals(estadoActual)) {
            return ASIGNAR;
        }
        if ("ASIGNADA".equals(estadoActual) || "EN_ATENCION".equals(estadoActual)) {
            return REASIGNAR;
        }
        return null;
    }
}
