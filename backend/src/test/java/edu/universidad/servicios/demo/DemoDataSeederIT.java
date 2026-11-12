package edu.universidad.servicios.demo;

import static org.assertj.core.api.Assertions.assertThat;

import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@TestPropertySource(properties = "spring.flyway.enabled=true")
class DemoDataSeederIT extends AbstractIntegrationTest {

    @Autowired UsuarioRepository usuarios;
    @Autowired RolRepository roles;
    @Autowired AreaRepository areas;
    @Autowired CategoriaRepository categorias;
    @Autowired PrioridadRepository prioridades;
    @Autowired EstadoSolicitudRepository estados;
    @Autowired SolicitudRepository solicitudes;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void cargaDosMilSolicitudesYEsIdempotente() {
        DemoDataSeeder seeder = new DemoDataSeeder(usuarios, roles, areas, categorias,
                prioridades, estados, solicitudes, encoder, jdbc, "clave-prueba", 200, "carga");

        seeder.run();
        assertThat(conteo()).isEqualTo(2000);
        assertThat(jdbc.queryForObject("SELECT COUNT(DISTINCT estado) FROM solicitudes WHERE codigo LIKE 'CARGA-%'", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM secuencias_solicitud", Integer.class)).isZero();

        seeder.run();
        assertThat(conteo()).isEqualTo(2000);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE codigo_institucional LIKE 'DEMO-%'", Integer.class)).isEqualTo(8);
    }

    private int conteo() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM solicitudes WHERE codigo LIKE 'CARGA-%'", Integer.class);
    }
}
