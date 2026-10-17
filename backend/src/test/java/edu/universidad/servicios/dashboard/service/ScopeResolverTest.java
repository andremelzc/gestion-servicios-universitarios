package edu.universidad.servicios.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ScopeResolverTest {

    private final ScopeResolver resolver = new ScopeResolver();

    @Test
    void administradorVeTodoOSoloElAreaSolicitada() {
        Usuario admin = usuario("ROLE_ADMIN", 1L, null);

        assertThat(resolver.resolve(admin, null)).isEqualTo(new DashboardScope(null, null));
        assertThat(resolver.resolve(admin, 5)).isEqualTo(new DashboardScope(5, null));
    }

    @Test
    void supervisorSoloVeSuAreaAunqueIntenteCambiarElFiltro() {
        Usuario supervisor = usuario("ROLE_SUPERVISOR", 2L, 3);

        assertThat(resolver.resolve(supervisor, null)).isEqualTo(new DashboardScope(3, null));
        assertThat(resolver.resolve(supervisor, 5)).isEqualTo(new DashboardScope(3, null));
    }

    @Test
    void tecnicoSoloVeSusSolicitudesAunquePidaOtraArea() {
        Usuario tecnico = usuario("ROLE_TECNICO", 8L, 3);

        assertThat(resolver.resolve(tecnico, 5)).isEqualTo(new DashboardScope(null, 8L));
    }

    @Test
    void estudianteYRolDesconocidoNoObtienenAlcanceGlobal() {
        assertForbidden(usuario("ROLE_ESTUDIANTE", 4L, null));
        assertForbidden(usuario("OTRO", 5L, null));
    }

    @Test
    void identidadOAlcanceIncompletoSeRechaza() {
        assertThatThrownBy(() -> resolver.resolve(null, null))
            .isInstanceOf(ResponseStatusException.class)
            .extracting("statusCode").isEqualTo(HttpStatus.UNAUTHORIZED);
        assertForbidden(usuario("ROLE_SUPERVISOR", 2L, null));
        assertForbidden(usuario("ROLE_TECNICO", null, 3));
    }

    @Test
    void cuentaInactivaNoObtieneAlcance() {
        Usuario admin = usuario("ROLE_ADMIN", 1L, null);
        admin.setActivo(false);
        assertForbidden(admin);
    }

    private void assertForbidden(Usuario actor) {
        assertThatThrownBy(() -> resolver.resolve(actor, 1))
            .isInstanceOf(ResponseStatusException.class)
            .extracting("statusCode").isEqualTo(HttpStatus.FORBIDDEN);
    }

    private Usuario usuario(String nombreRol, Long id, Integer idArea) {
        Rol rol = new Rol();
        rol.setNombre(nombreRol);
        Usuario actor = new Usuario();
        actor.setRol(rol);
        actor.setId(id);
        if (idArea != null) {
            Area area = new Area();
            area.setId(idArea);
            actor.setArea(area);
        }
        return actor;
    }
}
