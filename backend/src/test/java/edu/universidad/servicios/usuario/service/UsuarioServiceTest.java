package edu.universidad.servicios.usuario.service;

import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.TecnicoResponse;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private SolicitudRepository solicitudRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Area areaTI;
    private Area areaMantenimiento;

    private Rol rolSupervisor;
    private Rol rolAdmin;
    private Rol rolEstudiante;
    private Rol rolTecnico;

    private Usuario supervisorTI;
    private Usuario admin;
    private Usuario estudiante;
    private Usuario tecnico1;
    private Usuario tecnico2;

    @BeforeEach
    void setUp() {
        areaTI = new Area();
        areaTI.setId(1);
        areaTI.setNombre("TI");

        areaMantenimiento = new Area();
        areaMantenimiento.setId(2);
        areaMantenimiento.setNombre("Mantenimiento");

        rolSupervisor = new Rol();
        rolSupervisor.setId(3);
        rolSupervisor.setNombre("ROLE_SUPERVISOR");

        rolAdmin = new Rol();
        rolAdmin.setId(4);
        rolAdmin.setNombre("ROLE_ADMIN");

        rolEstudiante = new Rol();
        rolEstudiante.setId(1);
        rolEstudiante.setNombre("ROLE_ESTUDIANTE");

        rolTecnico = new Rol();
        rolTecnico.setId(2);
        rolTecnico.setNombre("ROLE_TECNICO");

        supervisorTI = new Usuario();
        supervisorTI.setId(30L);
        supervisorTI.setNombre("Ana");
        supervisorTI.setRol(rolSupervisor);
        supervisorTI.setArea(areaTI);

        admin = new Usuario();
        admin.setId(40L);
        admin.setNombre("Admin");
        admin.setRol(rolAdmin);

        estudiante = new Usuario();
        estudiante.setId(10L);
        estudiante.setRol(rolEstudiante);

        tecnico1 = new Usuario();
        tecnico1.setId(20L);
        tecnico1.setCodigoInstitucional("TEC-01");
        tecnico1.setNombre("Carlos");
        tecnico1.setApellido("Ruiz");
        tecnico1.setRol(rolTecnico);
        tecnico1.setArea(areaTI);
        tecnico1.setActivo(true);

        tecnico2 = new Usuario();
        tecnico2.setId(21L);
        tecnico2.setCodigoInstitucional("TEC-02");
        tecnico2.setNombre("Marcos");
        tecnico2.setApellido("Soto");
        tecnico2.setRol(rolTecnico);
        tecnico2.setArea(areaTI);
        tecnico2.setActivo(true);
    }

    @Test
    @DisplayName("[CA-17] Supervisor siempre consulta su propia área e incluye carga de trabajo")
    void supervisorFuerzaSuPropiaArea() {
        when(usuarioRepository.findTecnicosActivosPorArea(1)).thenReturn(List.of(tecnico1, tecnico2));

        // Simulamos que el técnico 20 tiene 3 solicitudes activas y el técnico 21 tiene 0
        List<Object[]> cargas = java.util.Collections.singletonList(new Object[]{20L, 3L});
        when(solicitudRepository.countCargasActualesPorTecnicos(List.of(20L, 21L))).thenReturn(cargas);

        // Se envía idAreaFiltro = 99 (de otra área), pero debe ser ignorado
        List<TecnicoResponse> lista = usuarioService.listarTecnicos(supervisorTI, 99);

        assertThat(lista).hasSize(2);
        assertThat(lista.get(0).id()).isEqualTo(20L);
        assertThat(lista.get(0).cargaActual()).isEqualTo(3L);

        assertThat(lista.get(1).id()).isEqualTo(21L);
        assertThat(lista.get(1).cargaActual()).isEqualTo(0L);

        verify(usuarioRepository).findTecnicosActivosPorArea(1);
    }

    @Test
    @DisplayName("Admin puede consultar cualquier área o todas si idArea es nulo")
    void adminPuedeConsultarCualquierArea() {
        when(usuarioRepository.findTecnicosActivosPorArea(2)).thenReturn(List.of());

        List<TecnicoResponse> lista = usuarioService.listarTecnicos(admin, 2);

        assertThat(lista).isEmpty();
        verify(usuarioRepository).findTecnicosActivosPorArea(2);
    }

    @Test
    @DisplayName("Usuario con rol no autorizado (Estudiante) recibe 403 Forbidden")
    void estudianteRecibe403() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                usuarioService.listarTecnicos(estudiante, 1)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Supervisor sin área asignada recibe 403 Forbidden")
    void supervisorSinAreaRecibe403() {
        supervisorTI.setArea(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                usuarioService.listarTecnicos(supervisorTI, null)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
