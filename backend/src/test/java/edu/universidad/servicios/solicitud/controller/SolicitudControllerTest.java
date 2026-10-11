package edu.universidad.servicios.solicitud.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.common.exception.GlobalExceptionHandler;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.dto.SolicitudCreadaResponse;
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

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SolicitudControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private SolicitudService solicitudService;

    @InjectMocks
    private SolicitudController solicitudController;

    private Usuario usuario;
    private UsuarioDetails usuarioDetails;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(solicitudController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
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
        // Título demasiado corto (< 5 chars) y sin descripción
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
    @DisplayName("POST /api/v1/solicitudes con archivo inválido retorna 415 Unsupported Media Type")
    void debeRetornar415CuandoTipoArchivoNoEsPermitido() throws Exception {
        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Problema en red wifi",
                "No hay conexión a la red de estudiantes en el pabellón A.",
                "Campus Central",
                "Pabellón A",
                1,
                1
        );

        when(solicitudService.crear(eq(request), any(), eq(usuario)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Solo se permiten archivos JPG, PNG o PDF"));

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        MockMultipartFile archivoExe = new MockMultipartFile(
                "archivos",
                "script.exe",
                "application/x-msdownload",
                new byte[]{0x4D, 0x5A}
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .file(archivoExe)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @DisplayName("POST /api/v1/solicitudes con archivo excediendo 5MB retorna 413 Payload Too Large")
    void debeRetornar413CuandoArchivoExcedeTamano() throws Exception {
        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Problema en proyector",
                "El proyector muestra rayas verdes intermitentes en la pantalla.",
                "Campus Central",
                "Pabellón B",
                1,
                1
        );

        when(solicitudService.crear(eq(request), any(), eq(usuario)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "El archivo supera el límite de 5 MB"));

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        MockMultipartFile archivoPesado = new MockMultipartFile(
                "archivos",
                "video.mp4",
                "video/mp4",
                new byte[6 * 1024 * 1024]
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .file(archivoPesado)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isPayloadTooLarge());
    }

    @Test
    @DisplayName("POST /api/v1/solicitudes sin autenticación retorna 401 Unauthorized")
    void debeRetornar401CuandoNoHayUsuarioAutenticado() throws Exception {
        SecurityContextHolder.clearContext();

        SolicitudCrearRequest request = new SolicitudCrearRequest(
                "Problema en red wifi",
                "No hay conexión a la red de estudiantes en el pabellón A.",
                "Campus Central",
                "Pabellón A",
                1,
                1
        );

        MockMultipartFile solicitudPart = new MockMultipartFile(
                "solicitud",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        mockMvc.perform(multipart("/api/v1/solicitudes")
                        .file(solicitudPart)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(solicitudService);
    }
}
