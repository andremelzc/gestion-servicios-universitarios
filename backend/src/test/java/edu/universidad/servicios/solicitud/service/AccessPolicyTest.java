package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AccessPolicyTest {

    private AccessPolicy accessPolicy;

    private Area areaSistemas;
    private Area areaMantenimiento;

    private Rol rolEstudiante;
    private Rol rolTecnico;
    private Rol rolSupervisor;
    private Rol rolAdmin;

    @BeforeEach
    void setUp() {
        accessPolicy = new AccessPolicy();

        areaSistemas = new Area();
        areaSistemas.setId(1);
        areaSistemas.setNombre("TI");

        areaMantenimiento = new Area();
        areaMantenimiento.setId(2);
        areaMantenimiento.setNombre("Mantenimiento");

        rolEstudiante = new Rol();
        rolEstudiante.setId(1);
        rolEstudiante.setNombre("ROLE_ESTUDIANTE");

        rolTecnico = new Rol();
        rolTecnico.setId(2);
        rolTecnico.setNombre("ROLE_TECNICO");

        rolSupervisor = new Rol();
        rolSupervisor.setId(3);
        rolSupervisor.setNombre("ROLE_SUPERVISOR");

        rolAdmin = new Rol();
        rolAdmin.setId(4);
        rolAdmin.setNombre("ROLE_ADMIN");
    }

    private Usuario crearUsuario(Long id, Rol rol, Area area) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNombre("User" + id);
        u.setApellido("Test");
        u.setRol(rol);
        u.setArea(area);
        u.setActivo(true);
        return u;
    }

    private Solicitud crearSolicitud(Long id, Usuario solicitante, Usuario tecnico, Area areaCategoria, String estadoCodigo) {
        Solicitud s = new Solicitud();
        s.setId(id);
        s.setSolicitante(solicitante);
        s.setTecnicoAsignado(tecnico);

        Categoria cat = new Categoria();
        cat.setId(10);
        cat.setArea(areaCategoria);
        s.setCategoria(cat);

        EstadoSolicitud est = new EstadoSolicitud();
        est.setCodigo(estadoCodigo);
        s.setEstado(est);

        return s;
    }

    @Test
    @DisplayName("Admin siempre puede ver cualquier solicitud")
    void adminPuedeVerCualquierSolicitud() {
        Usuario admin = crearUsuario(99L, rolAdmin, null);
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Solicitud solicitud = crearSolicitud(100L, estudiante, null, areaSistemas, "REGISTRADA");

        assertThat(accessPolicy.puedeVer(admin, solicitud)).isTrue();
    }

    @Test
    @DisplayName("Estudiante solo puede ver su propia solicitud y no la ajena (RN-16 / CA-12)")
    void estudianteSoloPuedeVerPropia() {
        Usuario estudianteA = crearUsuario(1L, rolEstudiante, null);
        Usuario estudianteB = crearUsuario(2L, rolEstudiante, null);

        Solicitud solicitudA = crearSolicitud(101L, estudianteA, null, areaSistemas, "REGISTRADA");

        assertThat(accessPolicy.puedeVer(estudianteA, solicitudA)).isTrue();
        assertThat(accessPolicy.puedeVer(estudianteB, solicitudA)).isFalse();
    }

    @Test
    @DisplayName("Técnico solo puede ver si está asignado o es el solicitante")
    void tecnicoSoloPuedeVerAsignadas() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Usuario tecnicoAsignado = crearUsuario(20L, rolTecnico, areaSistemas);
        Usuario tecnicoOtro = crearUsuario(21L, rolTecnico, areaSistemas);

        Solicitud solicitud = crearSolicitud(102L, estudiante, tecnicoAsignado, areaSistemas, "ASIGNADA");

        assertThat(accessPolicy.puedeVer(tecnicoAsignado, solicitud)).isTrue();
        assertThat(accessPolicy.puedeVer(tecnicoOtro, solicitud)).isFalse();
    }

    @Test
    @DisplayName("Supervisor puede ver solicitudes del área de su competencia")
    void supervisorPuedeVerMismaArea() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Usuario supervisorSistemas = crearUsuario(30L, rolSupervisor, areaSistemas);
        Usuario supervisorMantenimiento = crearUsuario(31L, rolSupervisor, areaMantenimiento);

        Solicitud solicitudSistemas = crearSolicitud(103L, estudiante, null, areaSistemas, "REGISTRADA");

        assertThat(accessPolicy.puedeVer(supervisorSistemas, solicitudSistemas)).isTrue();
        assertThat(accessPolicy.puedeVer(supervisorMantenimiento, solicitudSistemas)).isFalse();
    }

    @Test
    @DisplayName("Acciones permitidas en estado REGISTRADA para Supervisor y Estudiante")
    void accionesPermitidasEnRegistrada() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Usuario supervisor = crearUsuario(30L, rolSupervisor, areaSistemas);
        Solicitud solicitud = crearSolicitud(104L, estudiante, null, areaSistemas, "REGISTRADA");

        List<String> accionesSupervisor = accessPolicy.accionesPermitidas(supervisor, solicitud);
        assertThat(accionesSupervisor).contains("EVALUAR", "ASIGNAR", "COMENTAR");

        List<String> accionesEstudiante = accessPolicy.accionesPermitidas(estudiante, solicitud);
        assertThat(accionesEstudiante).containsExactly("COMENTAR");
    }

    @Test
    @DisplayName("Acciones permitidas en estado RESUELTA para Cierre")
    void accionesPermitidasEnResuelta() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Usuario tecnico = crearUsuario(20L, rolTecnico, areaSistemas);
        Solicitud solicitud = crearSolicitud(105L, estudiante, tecnico, areaSistemas, "RESUELTA");

        List<String> accionesEstudiante = accessPolicy.accionesPermitidas(estudiante, solicitud);
        assertThat(accionesEstudiante).contains("CERRAR", "COMENTAR");
    }

    @Test
    @DisplayName("Solicitud CERRADA no permite comentarios ni acciones adicionales")
    void solicitudCerradaSinAcciones() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Solicitud solicitud = crearSolicitud(106L, estudiante, null, areaSistemas, "CERRADA");

        List<String> acciones = accessPolicy.accionesPermitidas(estudiante, solicitud);
        assertThat(acciones).isEmpty();
    }

    @Test
    @DisplayName("puedeEjecutar valida permisos por rol y alcance según la matriz §2.2")
    void puedeEjecutarSegunMatriz() {
        Usuario estudiante = crearUsuario(1L, rolEstudiante, null);
        Usuario tecnicoAsignado = crearUsuario(20L, rolTecnico, areaSistemas);
        Usuario tecnicoAjeno = crearUsuario(21L, rolTecnico, areaSistemas);
        Usuario supervisorSistemas = crearUsuario(30L, rolSupervisor, areaSistemas);
        Usuario supervisorMantenimiento = crearUsuario(31L, rolSupervisor, areaMantenimiento);
        Usuario admin = crearUsuario(40L, rolAdmin, null);

        Solicitud solicitud = crearSolicitud(107L, estudiante, tecnicoAsignado, areaSistemas, "EN_ATENCION");

        // EVALUAR / ASIGNAR / REASIGNAR
        assertThat(accessPolicy.puedeEjecutar(supervisorSistemas, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(supervisorMantenimiento, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR)).isFalse();
        assertThat(accessPolicy.puedeEjecutar(admin, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(tecnicoAsignado, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.ASIGNAR)).isFalse();

        // INICIAR_ATENCION / RESOLVER
        assertThat(accessPolicy.puedeEjecutar(tecnicoAsignado, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(tecnicoAjeno, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER)).isFalse();
        assertThat(accessPolicy.puedeEjecutar(supervisorSistemas, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER)).isFalse();
        assertThat(accessPolicy.puedeEjecutar(admin, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.RESOLVER)).isTrue();

        // CERRAR
        assertThat(accessPolicy.puedeEjecutar(estudiante, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(supervisorSistemas, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(supervisorMantenimiento, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)).isFalse();
        assertThat(accessPolicy.puedeEjecutar(admin, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)).isTrue();
        assertThat(accessPolicy.puedeEjecutar(tecnicoAsignado, solicitud, edu.universidad.servicios.solicitud.domain.Transicion.CERRAR)).isFalse();
    }
}
