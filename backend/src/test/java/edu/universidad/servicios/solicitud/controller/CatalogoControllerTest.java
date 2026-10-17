package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.usuario.domain.Area;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CatalogoControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private PrioridadRepository prioridadRepository;

    @InjectMocks
    private CatalogoController catalogoController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(catalogoController).build();
    }

    @Test
    @DisplayName("GET /api/v1/categorias retorna 200 con lista de categorías activas")
    void debeListarCategoriasActivas() throws Exception {
        Area area = new Area();
        area.setId(1);
        area.setNombre("Tecnologías de la Información");

        Categoria c1 = new Categoria();
        c1.setId(1);
        c1.setNombre("Soporte de Software");
        c1.setDescripcion("Instalación y fallas");
        c1.setArea(area);
        c1.setTiempoSlaHoras(24);
        c1.setActivo(true);

        when(categoriaRepository.findByActivoTrueOrderByNombreAsc()).thenReturn(List.of(c1));

        mockMvc.perform(get("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].nombre", is("Soporte de Software")))
                .andExpect(jsonPath("$[0].idArea", is(1)))
                .andExpect(jsonPath("$[0].area", is("Tecnologías de la Información")))
                .andExpect(jsonPath("$[0].tiempoSlaHoras", is(24)))
                .andExpect(jsonPath("$[0].activo", is(true)));

        verify(categoriaRepository, times(1)).findByActivoTrueOrderByNombreAsc();
    }

    @Test
    @DisplayName("GET /api/v1/categorias?idArea=2 filtra categorías por el id de área especificado")
    void debeFiltrarCategoriasPorArea() throws Exception {
        Area area = new Area();
        area.setId(2);
        area.setNombre("Mantenimiento");

        Categoria c2 = new Categoria();
        c2.setId(4);
        c2.setNombre("Electricidad");
        c2.setArea(area);
        c2.setTiempoSlaHoras(24);
        c2.setActivo(true);

        when(categoriaRepository.findByAreaIdAndActivoTrueOrderByNombreAsc(2)).thenReturn(List.of(c2));

        mockMvc.perform(get("/api/v1/categorias?idArea=2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre", is("Electricidad")))
                .andExpect(jsonPath("$[0].idArea", is(2)));

        verify(categoriaRepository, times(1)).findByAreaIdAndActivoTrueOrderByNombreAsc(2);
    }

    @Test
    @DisplayName("GET /api/v1/prioridades retorna 200 con lista ordenada por ponderador")
    void debeListarPrioridadesActivas() throws Exception {
        Prioridad p1 = new Prioridad();
        p1.setId(1);
        p1.setNivel("BAJA");
        p1.setPonderador(1);
        p1.setSlaMaxHoras(72);
        p1.setActivo(true);

        Prioridad p2 = new Prioridad();
        p2.setId(2);
        p2.setNivel("ALTA");
        p2.setPonderador(3);
        p2.setSlaMaxHoras(24);
        p2.setActivo(true);

        when(prioridadRepository.findByActivoTrueOrderByPonderadorAsc()).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/v1/prioridades")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nivel", is("BAJA")))
                .andExpect(jsonPath("$[0].slaMaxHoras", is(72)))
                .andExpect(jsonPath("$[1].nivel", is("ALTA")))
                .andExpect(jsonPath("$[1].slaMaxHoras", is(24)));

        verify(prioridadRepository, times(1)).findByActivoTrueOrderByPonderadorAsc();
    }
}
