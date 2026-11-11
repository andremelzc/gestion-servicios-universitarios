package edu.universidad.servicios.catalogo.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import edu.universidad.servicios.catalogo.service.AreaService;
import edu.universidad.servicios.catalogo.service.CategoriaService;
import edu.universidad.servicios.catalogo.service.EstadoService;
import edu.universidad.servicios.catalogo.service.PrioridadService;
import edu.universidad.servicios.usuario.domain.Area;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AdministracionCatalogoControllerTest {

    private final AreaService areas = mock(AreaService.class);
    private final CategoriaService categorias = mock(CategoriaService.class);
    private final PrioridadService prioridades = mock(PrioridadService.class);
    private final EstadoService estados = mock(EstadoService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(
            new AdministracionCatalogoController(
                areas,
                categorias,
                prioridades,
                estados
            )
        ).build();
    }

    @Test
    void lecturaActivosYFiltroAdmin() throws Exception {
        var usuario = new UsernamePasswordAuthenticationToken(
            "u",
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ESTUDIANTE"))
        );
        var admin = new UsernamePasswordAuthenticationToken(
            "a",
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        when(areas.listar(false)).thenReturn(List.of());
        when(areas.listar(true)).thenReturn(List.of());
        mvc.perform(
            get("/api/v1/areas?incluirInactivos=true").principal(usuario)
        ).andExpect(status().isOk());
        mvc.perform(
            get("/api/v1/areas?incluirInactivos=true").principal(admin)
        ).andExpect(status().isOk());
        verify(areas).listar(false);
        verify(areas).listar(true);
    }

    @Test
    void detalleInactivoExigeParametroYRolAdmin() throws Exception {
        var usuario = new UsernamePasswordAuthenticationToken(
            "u",
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ESTUDIANTE"))
        );
        var admin = new UsernamePasswordAuthenticationToken(
            "a",
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        Area area = new Area();
        area.setId(3);
        area.setActivo(false);
        when(areas.obtener(3)).thenReturn(area);
        mvc.perform(get("/api/v1/areas/3").principal(admin)).andExpect(
            status().isNotFound()
        );
        mvc.perform(
            get("/api/v1/areas/3?incluirInactivos=true").principal(usuario)
        ).andExpect(status().isNotFound());
        mvc.perform(
            get("/api/v1/areas/3?incluirInactivos=true").principal(admin)
        ).andExpect(status().isOk());
    }

    @Test
    void crearAreaDevuelveUbicacionYDatos() throws Exception {
        Area area = new Area();
        area.setId(3);
        area.setNombre("TI");
        area.setCorreoContacto("ti@uni.edu");
        when(areas.crear("TI", "ti@uni.edu")).thenReturn(area);
        mvc.perform(
            post("/api/v1/areas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"nombre\":\"TI\",\"correoContacto\":\"ti@uni.edu\"}"
                )
        )
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/v1/areas/3"))
            .andExpect(jsonPath("$.nombre").value("TI"));
    }

    @Test
    void bajaLogicaRespondeSinContenido() throws Exception {
        mvc.perform(delete("/api/v1/categorias/4")).andExpect(
            status().isNoContent()
        );
        verify(categorias).desactivar(4);
    }
}
