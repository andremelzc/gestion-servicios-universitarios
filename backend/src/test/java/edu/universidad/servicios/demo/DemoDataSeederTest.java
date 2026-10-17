package edu.universidad.servicios.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class DemoDataSeederTest {

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final RolRepository roles = mock(RolRepository.class);
    private final AreaRepository areas = mock(AreaRepository.class);
    private final CategoriaRepository categorias = mock(CategoriaRepository.class);
    private final PrioridadRepository prioridades = mock(PrioridadRepository.class);
    private final EstadoSolicitudRepository estados = mock(EstadoSolicitudRepository.class);
    private final SolicitudRepository solicitudes = mock(SolicitudRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private DemoDataSeeder seeder;

    @BeforeEach
    void configurar() {
        seeder = crearSeeder("clave-demo", 6);
    }

    @Test
    void validaConfiguracionAntesDeConsultarCatalogos() {
        DemoDataSeeder sinPassword = crearSeeder(" ", 6);
        assertThatThrownBy(() -> sinPassword.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEMO_USER_PASSWORD");
        verify(roles, never()).count();

        DemoDataSeeder pocasSolicitudes = crearSeeder("clave-demo", 5);
        assertThatThrownBy(() -> pocasSolicitudes.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("al menos 6");
    }

    @Test
    void rechazaCatalogosIncompletos() {
        when(roles.count()).thenReturn(3L);
        assertThatThrownBy(() -> seeder.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Faltan catálogos");
    }

    @Test
    void creaSolicitudesDeDemostracionYOmiteCodigosExistentes() {
        prepararCatalogos();
        prepararUsuariosExistentes();
        when(solicitudes.existsByCodigo(any(String.class))).thenReturn(false);
        when(solicitudes.existsByCodigo(org.mockito.ArgumentMatchers.contains("0002"))).thenReturn(true);

        seeder.run();

        verify(solicitudes, org.mockito.Mockito.times(5)).save(any(Solicitud.class));
        verify(usuarios, never()).save(any(Usuario.class));
        assertThat(encoder.encode("clave-demo")).isNull();
    }

    @Test
    void creaUsuariosCuandoNoExistenYValidaQueSusRolesYAreasExistan() {
        prepararCatalogos();
        when(usuarios.findByCorreo(any(String.class))).thenReturn(Optional.empty());
        when(roles.findByNombre(any(String.class))).thenAnswer(invocation -> {
            Rol rol = new Rol();
            rol.setNombre(invocation.getArgument(0));
            return Optional.of(rol);
        });
        when(areas.findByNombre(any(String.class))).thenAnswer(invocation -> {
            Area area = new Area();
            area.setId(1);
            area.setNombre(invocation.getArgument(0));
            return Optional.of(area);
        });
        when(usuarios.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudes.existsByCodigo(any(String.class))).thenReturn(true);
        when(encoder.encode("clave-demo")).thenReturn("hash");

        seeder.run();

        verify(usuarios, org.mockito.Mockito.times(8)).save(any(Usuario.class));
        verify(encoder, org.mockito.Mockito.times(8)).encode("clave-demo");
    }

    @Test
    void fallaSiNoExisteUnRolNecesario() {
        prepararCatalogos();
        when(usuarios.findByCorreo(any(String.class))).thenReturn(Optional.empty());
        when(roles.findByNombre(any(String.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> seeder.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No existe el rol");
    }

    @Test
    void fallaSiNoExisteUnAreaNecesaria() {
        prepararCatalogos();
        when(usuarios.findByCorreo(any(String.class))).thenReturn(Optional.empty());
        when(roles.findByNombre(any(String.class))).thenAnswer(invocation -> {
            Rol rol = new Rol();
            rol.setNombre(invocation.getArgument(0));
            return Optional.of(rol);
        });
        when(areas.findByNombre(any(String.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> seeder.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No existe el área");
    }

    private DemoDataSeeder crearSeeder(String password, int cantidad) {
        return new DemoDataSeeder(usuarios, roles, areas, categorias, prioridades, estados,
                solicitudes, encoder, password, cantidad);
    }

    private void prepararCatalogos() {
        when(roles.count()).thenReturn(4L);
        when(areas.count()).thenReturn(3L);
        when(categorias.count()).thenReturn(3L);
        when(prioridades.count()).thenReturn(3L);
        when(estados.count()).thenReturn(6L);
        Area area = new Area();
        area.setId(1);
        Categoria categoria = new Categoria();
        categoria.setArea(area);
        when(categorias.findAll()).thenReturn(List.of(categoria));
        Prioridad prioridad = new Prioridad();
        prioridad.setSlaMaxHoras(24);
        when(prioridades.findByActivoTrueOrderByPonderadorAsc()).thenReturn(List.of(prioridad));
        List<String> codigos = List.of("REGISTRADA", "EN_EVALUACION", "ASIGNADA", "EN_ATENCION", "RESUELTA", "CERRADA");
        for (int i = 0; i < codigos.size(); i++) {
            EstadoSolicitud estado = new EstadoSolicitud();
            estado.setCodigo(codigos.get(i));
            estado.setOrden((byte) (i + 1));
            when(estados.findById(codigos.get(i))).thenReturn(Optional.of(estado));
        }
    }

    private void prepararUsuariosExistentes() {
        when(usuarios.findByCorreo(any(String.class))).thenAnswer(invocation -> {
            String correo = invocation.getArgument(0);
            Usuario usuario = new Usuario();
            usuario.setCorreo(correo);
            Rol rol = new Rol();
            if (correo.contains("admin")) rol.setNombre("ROLE_ADMIN");
            else if (correo.contains("supervisor")) rol.setNombre("ROLE_SUPERVISOR");
            else if (correo.contains("tecnico")) rol.setNombre("ROLE_TECNICO");
            else rol.setNombre("ROLE_ESTUDIANTE");
            usuario.setRol(rol);
            if (correo.contains("tecnico")) {
                Area area = new Area();
                area.setId(1);
                usuario.setArea(area);
            }
            return Optional.of(usuario);
        });
    }
}
