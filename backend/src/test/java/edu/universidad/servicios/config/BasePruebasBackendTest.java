package edu.universidad.servicios.config;

import edu.universidad.servicios.builder.UsuarioTestBuilder;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.time.Clock;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestClockConfig.class)
class BasePruebasBackendTest extends AbstractIntegrationTest {

    @Autowired
    private Clock clock;

    @Test
    @DisplayName("[QA-01] Clock fijo es inyectado correctamente y es determinista")
    void testClockFijoInyectado() {
        assertThat(clock).isNotNull();
        Instant ahora = clock.instant();
        assertThat(ahora).isEqualTo(TestClockConfig.FIXED_INSTANT);
    }

    @Test
    @DisplayName("[QA-01] UsuarioTestBuilder genera entidad Usuario con valores válidos por defecto")
    void testUsuarioBuilderDefault() {
        Usuario usuario = UsuarioTestBuilder.unUsuario().build();

        assertThat(usuario).isNotNull();
        assertThat(usuario.getNombre()).isEqualTo("Usuario");
        assertThat(usuario.getApellido()).isEqualTo("Prueba");
        assertThat(usuario.getCorreo()).isEqualTo("usuario.prueba@universidad.edu");
        assertThat(usuario.getRol()).isNotNull();
        assertThat(usuario.getRol().getNombre()).isEqualTo("ESTUDIANTE");
        assertThat(usuario.getActivo()).isTrue();
    }

    @Test
    @DisplayName("[QA-01] UsuarioTestBuilder genera correctamente usuarios para los 4 roles del sistema")
    void testUsuarioBuilderRoles() {
        Usuario admin = UsuarioTestBuilder.unUsuario().comoAdmin().build();
        Usuario supervisor = UsuarioTestBuilder.unUsuario().comoSupervisor().build();
        Usuario tecnico = UsuarioTestBuilder.unUsuario().comoTecnico().build();
        Usuario estudiante = UsuarioTestBuilder.unUsuario().comoEstudiante().build();

        assertThat(admin.getRol().getNombre()).isEqualTo("ADMIN");
        assertThat(admin.getCodigoInstitucional()).isEqualTo("ADM-001");

        assertThat(supervisor.getRol().getNombre()).isEqualTo("SUPERVISOR");
        assertThat(supervisor.getCodigoInstitucional()).isEqualTo("SUP-001");

        assertThat(tecnico.getRol().getNombre()).isEqualTo("TECNICO");
        assertThat(tecnico.getCodigoInstitucional()).isEqualTo("TEC-001");

        assertThat(estudiante.getRol().getNombre()).isEqualTo("ESTUDIANTE");
        assertThat(estudiante.getCodigoInstitucional()).isEqualTo("EST-001");
    }

    @Test
    @DisplayName("[QA-01] UsuarioTestBuilder permite configurar usuario inactivo")
    void testUsuarioBuilderInactivo() {
        Usuario inactivo = UsuarioTestBuilder.unUsuario().inactivo().build();
        assertThat(inactivo.getActivo()).isFalse();
    }
}
