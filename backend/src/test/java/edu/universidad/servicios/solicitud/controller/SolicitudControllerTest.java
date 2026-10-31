package edu.universidad.servicios.solicitud.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.common.exception.GlobalExceptionHandler;
import edu.universidad.servicios.solicitud.dto.*;
import edu.universidad.servicios.solicitud.service.SolicitudConsultaService;
import edu.universidad.servicios.solicitud.service.SolicitudService;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SolicitudControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private SolicitudService solicitudService;

    @Mock
    private SolicitudConsultaService solicitudConsultaService;

    @Mock
    private edu.universidad.servicios.solicitud.service.SolicitudWorkflowService solicitudWorkflowService;

    @InjectMocks
    private SolicitudController solicitudController;

    private Usuario usuario;
    private UsuarioDetails usuarioDetails;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(solicitudController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new AuthenticationPrincipalArgumentResolver(),
                        new PageableHandlerMethodArgumentResolver()
                )
                .build();

        Rol rol = new Rol();
        rol.setId(1);
        rol.setNombre("ESTUDIANTE");

        usuario = new Usuario();
        usuario.setId(10L);
        usuario.setNombre("Roberto");
        usuario.setApellido("Pizarro");
        usuario.setCorreo("roberto.pizarro@universidad.edu");
        usuario.setRol(rol);
        usuario.setActivo(true);

        usuarioDetails = new UsuarioDetails(usuario);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(usuarioDetails, null, usuarioDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/v1/solicitudes registra solicitud con archivos y retorna 201 con Location")
    void debeCrearSolicitudConArchivosExitosamente() throws Exception {
        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Proyector sin imagen",
                "El proyector del aula B-402 enciende pero no muestra imagen por HDMI.",
                "Campus Central",
                "Pabellón B - Aula 402",
                2,
                3
        );

        LocalDateTime now = LocalDateTime.of(2026, 10, 11, 14, 0, 0);
        LocalDateTime sla = now.plusHours(24);

        SolicitudCreadaResponse response = new SolicitudCreadaResponse(
                150L,
                "SOL-2026-0150",
                "Proyector sin imagen",
                "REGISTRADA",
                now,
                sla,
                "Solicitud registrada con éxito"
        );

        when(solicitudService.crear(eq(request), any(), eq(usuario))).thenReturn(response);

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        MockMultipartFile archivoPart = new MockMultipartFile(
                "archivos",
                "evidencia.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .file(archivoPart)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/solicitudes/150"))
                .andExpect(jsonPath("$.id", is(150)))
                .andExpect(jsonPath("$.codigo", is("SOL-2026-0150")))
                .andExpect(jsonPath("$.titulo", is("Proyector sin imagen")))
                .andExpect(jsonPath("$.estado", is("REGISTRADA")))
                .andExpect(jsonPath("$.mensaje", is("Solicitud registrada con éxito")));

        verify(solicitudService).crear(eq(request), any(), eq(usuario));
    }

    @Test
    @DisplayName("POST /api/v1/solicitudes sin archivos adjuntos registra exitosamente con 201")
    void debeCrearSolicitudSinArchivosExitosamente() throws Exception {
        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Aire acondicionado averiado",
                "El equipo no enfría y gotea agua en el piso del laboratorio.",
                "Campus Norte",
                "Edificio C - Lab 101",
                1,
                2
        );

        LocalDateTime now = LocalDateTime.of(2026, 10, 11, 15, 0, 0);
        SolicitudCreadaResponse response = new SolicitudCreadaResponse(
                151L,
                "SOL-2026-0151",
                "Aire acondicionado averiado",
                "REGISTRADA",
                now,
                now.plusHours(48),
                "Solicitud registrada con éxito"
        );

        when(solicitudService.crear(eq(request), isNull(), eq(usuario))).thenReturn(response);

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/solicitudes/151"))
                .andExpect(jsonPath("$.id", is(151)))
                .andExpect(jsonPath("$.codigo", is("SOL-2026-0151")))
                .andExpect(jsonPath("$.mensaje", is("Solicitud registrada con éxito")));

        verify(solicitudService).crear(eq(request), isNull(), eq(usuario));
    }

    @Test
    @DisplayName("POST /api/v1/solicitudes con datos inválidos retorna 400 Bad Request")
    void debeRetornar400CuandoValidacionFalla() throws Exception {
        SolicitudCrearRequest requestInvalido = new SolicitudCrearRequest(
                "Falla",
                "",
                "Campus",
                "Aula 1",
                null,
                null
        );

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(requestInvalido)
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Error de validación")))
                .andExpect(jsonPath("$.errores").exists());

        verifyNoInteractions(solicitudService);
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/mis-solicitudes retorna 200 con paginación (REG-11 / CA-11)")
    void debeRetornarMisSolicitudesPaginadas() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 10, 13, 10, 0);
        SolicitudResumenResponse item = new SolicitudResumenResponse(
                150L,
                "SOL-2026-0150",
                "Proyector sin imagen",
                "Equipos",
                "ALTA",
                "REGISTRADA",
                "Registrada",
                "#3B82F6",
                null,
                now,
                now.plusHours(24)
        );

        when(solicitudConsultaService.listarMisSolicitudes(eq(usuario), eq("REGISTRADA"), eq("proyector"), any()))
                .thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/solicitudes/mis-solicitudes")
                        .param("estado", "REGISTRADA")
                        .param("q", "proyector")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].codigo", is("SOL-2026-0150")))
                .andExpect(jsonPath("$.totalElements", is(1)));

        verify(solicitudConsultaService).listarMisSolicitudes(eq(usuario), eq("REGISTRADA"), eq("proyector"), any());
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/{id} retorna 200 con detalle completo (REG-12 / CA-13)")
    void debeRetornarDetalleSolicitud() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 10, 13, 10, 0);
        SolicitudDetalleResponse detalle = new SolicitudDetalleResponse(
                150L,
                "SOL-2026-0150",
                "Proyector sin imagen",
                "Falla en entrada HDMI",
                "Campus Central",
                "Aula 402",
                2,
                "Equipos",
                1,
                "TI",
                3,
                "ALTA",
                "REGISTRADA",
                "Registrada",
                "#3B82F6",
                10L,
                "Roberto Pizarro",
                null,
                null,
                null,
                now,
                now.plusHours(24),
                null,
                null,
                null,
                null,
                List.of(new EvidenciaItemResponse(1L, "INICIAL", "foto.jpg", "image/jpeg", 1024L)),
                List.of("COMENTAR")
        );

        when(solicitudConsultaService.obtenerDetalle(eq(150L), eq(usuario))).thenReturn(detalle);

        mockMvc.perform(get("/api/v1/solicitudes/150"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(150)))
                .andExpect(jsonPath("$.codigo", is("SOL-2026-0150")))
                .andExpect(jsonPath("$.evidencias", hasSize(1)))
                .andExpect(jsonPath("$.accionesPermitidas", hasSize(1)));

        verify(solicitudConsultaService).obtenerDetalle(eq(150L), eq(usuario));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/{id} retorna 404 cuando la solicitud es ajena (RN-16 / CA-12 IDOR)")
    void debeRetornar404CuandoSolicitudEsAjena() throws Exception {
        when(solicitudConsultaService.obtenerDetalle(eq(999L), eq(usuario)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        mockMvc.perform(get("/api/v1/solicitudes/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/{id}/historial retorna 200 con eventos cronológicos (REG-12)")
    void debeRetornarHistorialSolicitud() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 10, 13, 10, 0);
        HistorialItemResponse item = new HistorialItemResponse(
                now,
                "Roberto Pizarro",
                null,
                "REGISTRADA",
                "Registro inicial"
        );

        when(solicitudConsultaService.obtenerHistorial(eq(150L), eq(usuario))).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/solicitudes/150/historial"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].estadoNuevo", is("REGISTRADA")));

        verify(solicitudConsultaService).obtenerHistorial(eq(150L), eq(usuario));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/{id}/evidencias/{idEvidencia} descarga archivo con headers correctos (REG-12)")
    void debeDescargarEvidenciaCorrectamente() throws Exception {
        byte[] contenido = new byte[]{1, 2, 3, 4};
        var descarga = new SolicitudConsultaService.EvidenciaDescarga("captura.jpg", "image/jpeg", contenido);

        when(solicitudConsultaService.descargarEvidencia(eq(150L), eq(1L), eq(usuario))).thenReturn(descarga);

        mockMvc.perform(get("/api/v1/solicitudes/150/evidencias/1"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"captura.jpg\""))
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(contenido));

        verify(solicitudConsultaService).descargarEvidencia(eq(150L), eq(1L), eq(usuario));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes consulta bandeja general con filtros y paginación (GES-09)")
    void debeListarBandejaCorrectamente() throws Exception {
        SolicitudResumenResponse item = new SolicitudResumenResponse(
                150L, "SOL-2026-0150", "Problema de red", "Redes", "ALTA",
                "ASIGNADA", "Asignada", "#2563EB", "Carlos Ruiz",
                LocalDateTime.now(), LocalDateTime.now().plusDays(1), false
        );

        when(solicitudConsultaService.listarBandeja(
                eq(usuario), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/solicitudes")
                        .param("estado", "ASIGNADA")
                        .param("q", "red"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].codigo", is("SOL-2026-0150")))
                .andExpect(jsonPath("$.content[0].vencida", is(false)));

        verify(solicitudConsultaService).listarBandeja(
                eq(usuario), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/asignar delega al workflow service (GES-06)")
    void debeAsignarCorrectamente() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "ASIGNADA", "Asignada", "#2563EB", 20L, null);

        when(solicitudWorkflowService.asignar(eq(150L), any(SolicitudAsignarRequest.class), eq(usuario)))
                .thenReturn(detalle);

        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "Asignación");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/asignar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("ASIGNADA")))
                .andExpect(jsonPath("$.tecnicoId", is(20)));

        verify(solicitudWorkflowService).asignar(eq(150L), any(SolicitudAsignarRequest.class), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/iniciar-atencion delega al workflow service (GES-07)")
    void debeIniciarAtencionCorrectamente() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "EN_ATENCION", "En atención", "#7C3AED", 20L, null);

        when(solicitudWorkflowService.iniciarAtencion(eq(150L), eq(usuario)))
                .thenReturn(detalle);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/iniciar-atencion"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("EN_ATENCION")));

        verify(solicitudWorkflowService).iniciarAtencion(eq(150L), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/resolver procesa multipart y delega al workflow service (GES-08)")
    void debeResolverCorrectamente() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "RESUELTA", "Resuelta", "#059669", 20L, "Se resolvió el incidente con éxito.");

        when(solicitudWorkflowService.resolver(eq(150L), any(SolicitudResolverRequest.class), any(), eq(usuario)))
                .thenReturn(detalle);

        MockMultipartFile datosPart = new MockMultipartFile(
                "datos", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(new SolicitudResolverRequest("Se resolvió el incidente con éxito."))
        );
        MockMultipartFile archivoPart = new MockMultipartFile(
                "archivos", "evidencia.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/api/v1/solicitudes/150/resolver")
                        .file(datosPart)
                        .file(archivoPart)
                        .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("RESUELTA")))
                .andExpect(jsonPath("$.informeResolucion", is("Se resolvió el incidente con éxito.")));

        verify(solicitudWorkflowService).resolver(eq(150L), any(SolicitudResolverRequest.class), any(), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/evaluar procesa solicitud y delega al workflow service (GES-11)")
    void debeEvaluarCorrectamente() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "EN_EVALUACION", "En evaluación", "#D97706", null, null);

        when(solicitudWorkflowService.evaluar(eq(150L), eq(4), eq("Evaluación técnica conforme"), eq(usuario)))
                .thenReturn(detalle);

        SolicitudEvaluarRequest req = new SolicitudEvaluarRequest(4, "Evaluación técnica conforme");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/evaluar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("EN_EVALUACION")));

        verify(solicitudWorkflowService).evaluar(eq(150L), eq(4), eq("Evaluación técnica conforme"), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/evaluar permite petición sin cuerpo (valores nulos opcionales)")
    void debeEvaluarSinCuerpo() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "EN_EVALUACION", "En evaluación", "#D97706", null, null);

        when(solicitudWorkflowService.evaluar(eq(150L), isNull(), isNull(), eq(usuario)))
                .thenReturn(detalle);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/evaluar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("EN_EVALUACION")));

        verify(solicitudWorkflowService).evaluar(eq(150L), isNull(), isNull(), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/cerrar procesa cierre formal y delega al workflow service (GES-13)")
    void debeCerrarCorrectamente() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "CERRADA", "Cerrada", "#047857", 20L, "Solución OK");

        when(solicitudWorkflowService.cerrar(eq(150L), eq("Conforme con la solución"), eq(usuario)))
                .thenReturn(detalle);

        SolicitudCerrarRequest req = new SolicitudCerrarRequest("Conforme con la solución");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/cerrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("CERRADA")));

        verify(solicitudWorkflowService).cerrar(eq(150L), eq("Conforme con la solución"), eq(usuario));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/cerrar permite petición sin cuerpo opcional")
    void debeCerrarSinCuerpo() throws Exception {
        SolicitudDetalleResponse detalle = crearDetalleMock(150L, "CERRADA", "Cerrada", "#047857", 20L, "Solución OK");

        when(solicitudWorkflowService.cerrar(eq(150L), isNull(), eq(usuario)))
                .thenReturn(detalle);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/cerrar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoCodigo", is("CERRADA")));

        verify(solicitudWorkflowService).cerrar(eq(150L), isNull(), eq(usuario));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes/mis-solicitudes con sort no permitido retorna 400 Bad Request RFC 7807 (CA-6 / OPS-11)")
    void debeRetornar400CuandoSortNoEstaEnListaBlancaMisSolicitudes() throws Exception {
        mockMvc.perform(get("/api/v1/solicitudes/mis-solicitudes")
                        .param("sort", "passwordHash,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Petición inválida")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("passwordHash")));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes con inyección en sort retorna 400 Bad Request RFC 7807 (CA-6 / OPS-11)")
    void debeRetornar400CuandoHayInyeccionEnSortBandeja() throws Exception {
        mockMvc.perform(get("/api/v1/solicitudes")
                        .param("sort", "' OR 1=1 --"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Petición inválida")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("' OR 1=1 --")));
    }

    @Test
    @DisplayName("GET /api/v1/solicitudes con tamaño mayor a 100 retorna 400 Bad Request RFC 7807 (OPS-11)")
    void debeRetornar400CuandoSizeExcedeLimiteMaximo() throws Exception {
        mockMvc.perform(get("/api/v1/solicitudes")
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Petición inválida")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("excede el límite máximo permitido de 100")));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/asignar con HTML en nota retorna 400 Bad Request RFC 7807 (RN-18 / OPS-08)")
    void debeRetornar400CuandoAsignarContieneHtml() throws Exception {
        SolicitudAsignarRequest req = new SolicitudAsignarRequest(20L, "<script>alert('xss')</script>Nota");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/solicitudes/150/asignar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Error de validación")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errores.nota").value(org.hamcrest.Matchers.containsString("etiquetas HTML")));
    }

    @Test
    @DisplayName("PUT /api/v1/solicitudes/{id}/resolver con HTML en informe retorna 400 Bad Request RFC 7807 (RN-18 / OPS-08)")
    void debeRetornar400CuandoResolverContieneHtml() throws Exception {
        MockMultipartFile datosPart = new MockMultipartFile(
                "datos", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(new SolicitudResolverRequest("<img src=x onerror=alert(1)> Se solucionó el problema."))
        );

        mockMvc.perform(multipart("/api/v1/solicitudes/150/resolver")
                        .file(datosPart)
                        .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Error de validación")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errores.informe").value(org.hamcrest.Matchers.containsString("etiquetas HTML")));
    }

    private SolicitudDetalleResponse crearDetalleMock(Long id, String estadoCodigo, String estadoNombre, String colorHex, Long tecnicoId, String informe) {
        return new SolicitudDetalleResponse(
                id, "SOL-2026-0150", "Titulo", "Descripcion", "Campus Central", "Aula 101",
                1, "Redes", 1, "TI", 3, "ALTA",
                estadoCodigo, estadoNombre, colorHex,
                1L, "Juan Perez", tecnicoId, "Carlos Ruiz",
                informe, LocalDateTime.now(), LocalDateTime.now().plusDays(1),
                LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), null,
                List.of(), List.of("COMENTAR")
        );
    }
}
