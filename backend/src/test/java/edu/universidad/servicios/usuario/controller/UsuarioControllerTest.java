package edu.universidad.servicios.usuario.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.TecnicoResponse;
import edu.universidad.servicios.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private UsuarioController usuarioController;

    private Area areaTI;
    private Usuario supervisorTI;
    private Usuario admin;

    @BeforeEach
    void setUp() {
        areaTI = new Area();
        areaTI.setId(1);
        areaTI.setNombre("TI");

        Rol rolSupervisor = new Rol();
        rolSupervisor.setId(3);
        rolSupervisor.setNombre("ROLE_SUPERVISOR");

        Rol rolAdmin = new Rol();
        rolAdmin.setId(4);
        rolAdmin.setNombre("ROLE_ADMIN");

        supervisorTI = new Usuario();
        supervisorTI.setId(30L);
        supervisorTI.setNombre("Ana");
        supervisorTI.setApellido("Torres");
        supervisorTI.setRol(rolSupervisor);
        supervisorTI.setArea(areaTI);

        admin = new Usuario();
        admin.setId(40L);
        admin.setNombre("Admin");
        admin.setApellido("General");
        admin.setRol(rolAdmin);
    }

    @Test
    @DisplayName("[CA-17] GET /usuarios/tecnicos para Supervisor delega al servicio")
    void listarTecnicosSupervisor() {
        UsuarioDetails details = new UsuarioDetails(supervisorTI);
        Authentication auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());

        TecnicoResponse tec = new TecnicoResponse(
                20L, "TEC-001", "Carlos", "Ruiz", "carlos@uni.edu", "999888777",
                1, "TI", true, 2L
        );

        when(usuarioService.listarTecnicos(supervisorTI, 2)).thenReturn(List.of(tec));

        // El controlador pasa el request al servicio (el servicio forzará el área de Ana)
        ResponseEntity<List<TecnicoResponse>> response = usuarioController.listarTecnicos(2, auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).cargaActual()).isEqualTo(2L);
        verify(usuarioService).listarTecnicos(supervisorTI, 2);
    }

    @Test
    @DisplayName("GET /usuarios/tecnicos para Admin delega correctamente al servicio")
    void listarTecnicosAdmin() {
        UsuarioDetails details = new UsuarioDetails(admin);
        Authentication auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());

        when(usuarioService.listarTecnicos(admin, 1)).thenReturn(List.of());

        ResponseEntity<List<TecnicoResponse>> response = usuarioController.listarTecnicos(1, auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
        verify(usuarioService).listarTecnicos(admin, 1);
    }

    @Test
    @DisplayName("GET /usuarios/tecnicos sin autenticación lanza 401 Unauthorized")
    void listarTecnicosSinAuthLanza401() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                usuarioController.listarTecnicos(null, null)
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
