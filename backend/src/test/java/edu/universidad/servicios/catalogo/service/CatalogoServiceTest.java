package edu.universidad.servicios.catalogo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class CatalogoServiceTest {

    private CategoriaRepository categorias;
    private AreaRepository areas;
    private UsuarioRepository usuarios;
    private PrioridadRepository prioridades;
    private EstadoSolicitudRepository estados;
    private CategoriaService categoriaService;
    private AreaService areaService;
    private PrioridadService prioridadService;
    private EstadoService estadoService;

    @BeforeEach
    void preparar() {
        categorias = mock(CategoriaRepository.class);
        areas = mock(AreaRepository.class);
        usuarios = mock(UsuarioRepository.class);
        prioridades = mock(PrioridadRepository.class);
        estados = mock(EstadoSolicitudRepository.class);
        categoriaService = new CategoriaService(categorias, areas);
        areaService = new AreaService(areas, usuarios, categorias);
        prioridadService = new PrioridadService(prioridades);
        estadoService = new EstadoService(estados);
    }

    @Test
    void categoriaCreacionYValidaciones() {
        Area area = area(1, true);
        when(areas.findByIdForUpdate(1)).thenReturn(Optional.of(area));
        when(categorias.save(any())).thenAnswer(i -> i.getArgument(0));
        Categoria creada = categoriaService.crear(" Redes ", "Red", 1, 24);
        assertEquals("Redes", creada.getNombre());
        assertEquals(area, creada.getArea());
        assertTrue(creada.getActivo());
        Categoria existente = new Categoria();
        existente.setId(3);
        existente.setNombre("REDES");
        when(categorias.findByNombreIgnoreCase("redes")).thenReturn(
            Optional.of(existente)
        );
        assertStatus(HttpStatus.CONFLICT, () ->
            categoriaService.crear("redes", null, 1, 24)
        );
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            categoriaService.crear("Otra", null, 1, 0)
        );
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            categoriaService.crear("Otra", null, null, 1)
        );
        area.setActivo(false);
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            categoriaService.crear("Otra", null, 1, 1)
        );
    }

    @Test
    void categoriaBajaReactivacionYFiltros() {
        Categoria c = new Categoria();
        c.setId(1);
        c.setNombre("Redes");
        c.setArea(area(2, true));
        when(areas.findByIdForUpdate(2)).thenReturn(Optional.of(c.getArea()));
        when(categorias.findByIdForUpdate(1)).thenReturn(Optional.of(c));
        when(categorias.findAll()).thenReturn(List.of(c));
        when(categorias.save(any())).thenAnswer(i -> i.getArgument(0));
        categoriaService.desactivar(1);
        assertFalse(c.getActivo());
        assertTrue(categoriaService.listar(false, null).isEmpty());
        assertEquals(1, categoriaService.listar(true, 2).size());
        assertTrue(categoriaService.listar(true, 3).isEmpty());
        categoriaService.reactivar(1);
        assertEquals(1, categoriaService.listar(false, null).size());
        verify(categorias, never()).delete(any());
        assertStatus(HttpStatus.NOT_FOUND, () -> categoriaService.obtener(99));
    }

    @Test
    void areaRechazaUsuariosActivosYPermiteBajaYReactivacion() {
        Area area = area(1, true);
        when(areas.findByIdForUpdate(1)).thenReturn(Optional.of(area));
        when(usuarios.existsByAreaIdAndActivoTrue(1)).thenReturn(true, false);
        assertStatus(HttpStatus.CONFLICT, () -> areaService.desactivar(1));
        assertTrue(area.getActivo());

        areaService.desactivar(1);
        assertFalse(area.getActivo());
        when(areas.save(any())).thenAnswer(i -> i.getArgument(0));
        areaService.reactivar(1);
        assertTrue(area.getActivo());
        verify(areas, times(3)).findByIdForUpdate(1);
        verify(areas, never()).findById(1);
        verify(areas, never()).delete(any());
    }

    @Test
    void areaRechazaCategoriasActivasSinModificarla() {
        Area area = area(1, true);
        when(areas.findByIdForUpdate(1)).thenReturn(Optional.of(area));
        when(categorias.existsByAreaIdAndActivoTrue(1)).thenReturn(true);

        var error = assertThrows(ResponseStatusException.class, () ->
            areaService.desactivar(1)
        );
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(
            "Reasigne o desactive las categorías del área primero",
            error.getReason()
        );
        assertTrue(area.getActivo());
        verify(areas, never()).save(any());
        verify(categorias, never()).findAll();
    }

    @Test
    void areaValidaCorreoYUnicidad() {
        Area existente = area(1, true);
        existente.setNombre("TI");
        when(areas.findByNombreIgnoreCase("ti")).thenReturn(
            Optional.of(existente)
        );
        assertStatus(HttpStatus.CONFLICT, () ->
            areaService.crear("ti", "ti@universidad.edu")
        );
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            areaService.crear("Otra", "invalido")
        );
        when(areas.save(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals(
            "Otra",
            areaService.crear("Otra", "ti@universidad.edu").getNombre()
        );
    }

    @Test
    void prioridadActualizaSoloCatalogoYValidaNivelYSla() {
        Prioridad p = new Prioridad();
        p.setId(1);
        p.setNivel("ALTA");
        p.setPonderador(1);
        p.setSlaMaxHoras(24);
        when(prioridades.findById(1)).thenReturn(Optional.of(p));
        when(prioridades.findAll()).thenReturn(List.of(p));
        when(prioridades.findByNivelIgnoreCase("alta")).thenReturn(
            Optional.of(p)
        );
        when(prioridades.findByNivelIgnoreCase("ALTA")).thenReturn(
            Optional.of(p)
        );
        when(prioridades.save(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals(
            12,
            prioridadService.actualizar(1, "alta", 1, 12).getSlaMaxHoras()
        );
        assertStatus(HttpStatus.CONFLICT, () ->
            prioridadService.crear("ALTA", 2, 2)
        );
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            prioridadService.crear("BAJA", 2, 0)
        );
        prioridadService.desactivar(1);
        assertTrue(prioridadService.listar(false).isEmpty());
        prioridadService.reactivar(1);
        assertEquals(1, prioridadService.listar(false).size());
        verify(prioridades, never()).delete(any());
    }

    @Test
    void estadoSoloModificaPresentacionYValidaColor() {
        EstadoSolicitud estado = new EstadoSolicitud();
        estado.setCodigo("EN_EVALUACION");
        estado.setEsFinal(false);
        estado.setOrden((byte) 2);
        when(estados.findById("EN_EVALUACION")).thenReturn(Optional.of(estado));
        when(estados.save(any())).thenAnswer(i -> i.getArgument(0));
        estadoService.actualizarPresentacion(
            "EN_EVALUACION",
            "En revisión",
            "Texto",
            "#D97706"
        );
        assertEquals("EN_EVALUACION", estado.getCodigo());
        assertFalse(estado.getEsFinal());
        assertEquals((byte) 2, estado.getOrden());
        assertStatus(HttpStatus.BAD_REQUEST, () ->
            estadoService.actualizarPresentacion(
                "EN_EVALUACION",
                "Nombre",
                null,
                "rojo"
            )
        );
        assertStatus(HttpStatus.NOT_FOUND, () ->
            estadoService.actualizarPresentacion(
                "INEXISTENTE",
                "Nombre",
                null,
                "#000000"
            )
        );
    }

    @Test
    void reactivarCategoriaExigeAreaActiva() {
        Categoria categoria = new Categoria();
        categoria.setArea(area(2, false));
        categoria.setActivo(false);
        when(categorias.findByIdForUpdate(1)).thenReturn(
            Optional.of(categoria)
        );
        when(areas.findByIdForUpdate(2)).thenReturn(
            Optional.of(categoria.getArea())
        );
        assertStatus(HttpStatus.CONFLICT, () -> categoriaService.reactivar(1));
        assertFalse(categoria.getActivo());
        verify(categorias, never()).save(any());
    }

    @Test
    void unicidadIncluyeInactivosYPuedeConservarNombrePropio() {
        Area area = area(1, false);
        area.setNombre("TI");
        when(areas.findByIdForUpdate(1)).thenReturn(Optional.of(area));
        when(areas.findByNombreIgnoreCase("TI")).thenReturn(Optional.of(area));
        when(areas.save(any())).thenAnswer(i -> i.getArgument(0));
        assertStatus(HttpStatus.CONFLICT, () ->
            areaService.crear("TI", "ti@universidad.edu")
        );
        assertSame(area, areaService.actualizar(1, "TI", "ti@universidad.edu"));
        verify(areas).findByIdForUpdate(1);
        verify(areas, never()).findById(1);
        verify(areas, never()).findAll();
        verify(usuarios, never()).findAll();
    }

    private static Area area(int id, boolean activa) {
        Area area = new Area();
        area.setId(id);
        area.setNombre("Área");
        area.setActivo(activa);
        return area;
    }

    private static void assertStatus(
        HttpStatus status,
        org.junit.jupiter.api.function.Executable accion
    ) {
        assertEquals(
            status,
            assertThrows(ResponseStatusException.class, accion).getStatusCode()
        );
    }
}
