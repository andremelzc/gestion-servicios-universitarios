package edu.universidad.servicios.dashboard.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.dashboard.repository.DashboardKpis;
import edu.universidad.servicios.dashboard.repository.DashboardRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

    private static final LocalDate DESDE = LocalDate.of(2026, 10, 1);
    private static final LocalDate HASTA = LocalDate.of(2026, 10, 15);
    private static final String[] RUTAS = {"kpis", "por-categoria", "por-prioridad", "por-estado", "por-responsable", "vencidas"};

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private DashboardRepository repository;

    @Test
    void administradorPuedeConsultarLosSeisEndpointsConFiltros() throws Exception {
        UsuarioDetails admin = principal("ROLE_ADMIN", 1L, null);
        when(repository.kpis(DESDE, HASTA, 2, null))
            .thenReturn(new DashboardKpis(3, 1, 2, new BigDecimal("4.0"), 1));

        for (String ruta : RUTAS) {
            mvc.perform(get("/api/v1/dashboard/" + ruta)
                    .param("desde", "2026-10-01").param("hasta", "2026-10-15")
                    .param("idArea", "2").with(user(admin)))
                .andExpect(status().isOk());
        }
        verify(repository).kpis(DESDE, HASTA, 2, null);
        verify(repository).porCategoria(DESDE, HASTA, 2, null);
        verify(repository).porPrioridad(DESDE, HASTA, 2, null);
        verify(repository).porEstado(DESDE, HASTA, 2, null);
        verify(repository).porResponsable(DESDE, HASTA, 2, null);
        verify(repository).vencidas(DESDE, HASTA, 2, null, PageRequest.of(0, 20));
    }

    @Test
    void estudianteRecibe403EnTodosLosEndpoints() throws Exception {
        UsuarioDetails estudiante = principal("ROLE_ESTUDIANTE", 3L, null);
        for (String ruta : RUTAS) {
            mvc.perform(get("/api/v1/dashboard/" + ruta).with(user(estudiante)))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(repository);
    }

    @Test
    void supervisorNoPuedeSuplantarElAreaDeOtraPersona() throws Exception {
        UsuarioDetails supervisor = principal("ROLE_SUPERVISOR", 4L, 3);
        when(repository.kpis(DESDE, HASTA, 3, null))
            .thenReturn(new DashboardKpis(0, 0, 0, null, 0));

        mvc.perform(get("/api/v1/dashboard/kpis")
                .param("desde", "2026-10-01").param("hasta", "2026-10-15")
                .param("idArea", "99").with(user(supervisor)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.registradas").value(0));
        verify(repository).kpis(DESDE, HASTA, 3, null);
    }

    @Test
    void tecnicoSoloVeSusSolicitudes() throws Exception {
        UsuarioDetails tecnico = principal("ROLE_TECNICO", 8L, 3);
        when(repository.kpis(DESDE, HASTA, null, 8L))
            .thenReturn(new DashboardKpis(8, 5, 3, new BigDecimal("2.5"), 2));

        mvc.perform(get("/api/v1/dashboard/kpis")
                .param("desde", "2026-10-01").param("hasta", "2026-10-15")
                .param("idArea", "99").with(user(tecnico)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.registradas").value(8));
        verify(repository).kpis(DESDE, HASTA, null, 8L);
    }

    @Test
    void rangoInvertidoYFechaMalformadaResponden400() throws Exception {
        UsuarioDetails admin = principal("ROLE_ADMIN", 1L, null);
        mvc.perform(get("/api/v1/dashboard/por-estado")
                .param("desde", "2026-10-16").param("hasta", "2026-10-01").with(user(admin)))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/dashboard/kpis")
                .param("desde", "16-10-2026").with(user(admin)))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(repository);
    }

    @Test
    void openApiPublicaLosSeisEndpoints() throws Exception {
        mvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.paths['/api/v1/dashboard/kpis'].get").exists())
            .andExpect(jsonPath("$.paths['/api/v1/dashboard/vencidas'].get").exists());
    }

    private UsuarioDetails principal(String rolNombre, Long id, Integer idArea) {
        Rol rol = new Rol();
        rol.setNombre(rolNombre);
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setRol(rol);
        usuario.setCorreo("dashboard@universidad.edu");
        usuario.setPasswordHash("test-only");
        if (idArea != null) {
            Area area = new Area();
            area.setId(idArea);
            usuario.setArea(area);
        }
        return new UsuarioDetails(usuario);
    }
}
