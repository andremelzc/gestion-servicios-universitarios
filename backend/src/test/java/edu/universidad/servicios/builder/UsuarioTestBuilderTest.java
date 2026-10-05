package edu.universidad.servicios.builder;

import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioTestBuilderTest {

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
        assertThat(admin.getCorreo()).isEqualTo("admin.prueba@universidad.edu");

        assertThat(supervisor.getRol().getNombre()).isEqualTo("SUPERVISOR");
        assertThat(supervisor.getCodigoInstitucional()).isEqualTo("SUP-001");
        assertThat(supervisor.getCorreo()).isEqualTo("supervisor.prueba@universidad.edu");

        assertThat(tecnico.getRol().getNombre()).isEqualTo("TECNICO");
        assertThat(tecnico.getCodigoInstitucional()).isEqualTo("TEC-001");
        assertThat(tecnico.getCorreo()).isEqualTo("tecnico.prueba@universidad.edu");

        assertThat(estudiante.getRol().getNombre()).isEqualTo("ESTUDIANTE");
        assertThat(estudiante.getCodigoInstitucional()).isEqualTo("EST-001");
        assertThat(estudiante.getCorreo()).isEqualTo("estudiante.prueba@universidad.edu");
    }

    @Test
    @DisplayName("[QA-01] UsuarioTestBuilder permite configurar usuario inactivo")
    void testUsuarioBuilderInactivo() {
        Usuario inactivo = UsuarioTestBuilder.unUsuario().inactivo().build();
        assertThat(inactivo.getActivo()).isFalse();
    }

    @Test
    @DisplayName("[QA-01] UsuarioTestBuilder permite personalizar campos específicos")
    void testUsuarioBuilderCustomFields() {
        Usuario personalizado = UsuarioTestBuilder.unUsuario()
                .conId(99L)
                .conNombre("Carlos")
                .conApellido("Sanchez")
                .conCorreo("carlos.sanchez@universidad.edu")
                .conTelefono("912345678")
                .conCodigoInstitucional("DOC-001")
                .build();

        assertThat(personalizado.getId()).isEqualTo(99L);
        assertThat(personalizado.getNombre()).isEqualTo("Carlos");
        assertThat(personalizado.getApellido()).isEqualTo("Sanchez");
        assertThat(personalizado.getCorreo()).isEqualTo("carlos.sanchez@universidad.edu");
        assertThat(personalizado.getTelefono()).isEqualTo("912345678");
        assertThat(personalizado.getCodigoInstitucional()).isEqualTo("DOC-001");
    }
}
