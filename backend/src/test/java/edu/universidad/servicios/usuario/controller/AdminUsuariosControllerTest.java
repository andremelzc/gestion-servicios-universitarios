package edu.universidad.servicios.usuario.controller;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.dto.*;
import edu.universidad.servicios.usuario.service.AdminUsuarioService;
import java.util.List;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminUsuariosControllerTest {
    @Mock AdminUsuarioService servicio;
    @InjectMocks AdminUsuariosController controller;
    UsuarioDetails actor;
    UsuarioAdminResponse respuesta = new UsuarioAdminResponse(22L, "COD123", "Luis", "Gomez", "luis@universidad.edu", null, "ESTUDIANTE", null, true);
    @BeforeEach void preparar() { Usuario u = new Usuario(); u.setId(10L); actor = new UsuarioDetails(u); }
    @Test void listadoDelegaTodosLosFiltrosYPaginacion() {
        var pagina = new AdminUsuarioService.Pagina<>(List.of(respuesta), 2, 20, 41, 3);
        when(servicio.listar("TECNICO", 3, false, "Luis", 2, 20)).thenReturn(pagina);
        assertThat(controller.listar("TECNICO", 3, false, "Luis", 2, 20)).isEqualTo(pagina);
    }
    @Test void crearDevuelve201LocationYActor() {
        var d = new UsuarioCrearRequest(); when(servicio.crear(d, 10L)).thenReturn(respuesta);
        var resultado = controller.crear(d, actor);
        assertThat(resultado.getStatusCode().value()).isEqualTo(201);
        assertThat(resultado.getHeaders().getLocation().toString()).isEqualTo("/api/v1/admin/usuarios/22");
        assertThat(resultado.getBody()).isEqualTo(respuesta);
    }
    @Test void detalleEdicionBajaYReactivacion() {
        var d = new UsuarioActualizarRequest();
        when(servicio.obtener(22L)).thenReturn(respuesta);
        when(servicio.actualizar(22L, d, 10L)).thenReturn(respuesta);
        when(servicio.reactivar(22L, 10L)).thenReturn(respuesta);
        assertThat(controller.obtener(22L)).isEqualTo(respuesta);
        assertThat(controller.actualizar(22L, d, actor)).isEqualTo(respuesta);
        controller.desactivar(22L, actor); verify(servicio).desactivar(22L, 10L);
        assertThat(controller.reactivar(22L, actor)).isEqualTo(respuesta);
    }
}
