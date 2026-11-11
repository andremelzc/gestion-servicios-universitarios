package edu.universidad.servicios.solicitud.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.solicitud.dto.*;
import edu.universidad.servicios.solicitud.service.ComentarioService;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ComentarioControllerTest {
    private final ComentarioService service = mock(ComentarioService.class);
    private final Usuario actor = new Usuario();
    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(new UsuarioDetails(actor), null, List.of()));
        mvc = MockMvcBuilders.standaloneSetup(new ComentarioController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
    }

    @AfterEach
    void limpiar() { SecurityContextHolder.clearContext(); }

    @Test
    void getDevuelveListaVisible() throws Exception {
        when(service.listar(10L, actor)).thenReturn(List.of(new ComentarioResponse(1L, "Texto", false, "Ana", null)));
        mvc.perform(get("/api/v1/solicitudes/10/comentarios"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].comentario").value("Texto"));
    }

    @Test
    void postDevuelve201YPrivadoPorDefectoFalse() throws Exception {
        when(service.crear(eq(10L), same(actor), any())).thenReturn(new ComentarioResponse(1L, "Texto", false, "Ana", null));
        mvc.perform(post("/api/v1/solicitudes/10/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content("{\"comentario\":\"Texto\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(1));
        verify(service).crear(10L, actor, new ComentarioCrearRequest("Texto", false));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "<b>Texto</b>", "<script>alert(1)</script>"})
    void rechazaTextoInvalido(String texto) throws Exception {
        String json = texto == null ? "{}" : "{\"comentario\":\"" + texto + "\"}";
        mvc.perform(post("/api/v1/solicitudes/10/comentarios").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void rechazaMasDe500Caracteres() throws Exception {
        mvc.perform(post("/api/v1/solicitudes/10/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content("{\"comentario\":\"" + "a".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 500})
    void aceptaLimitesDeLongitud(int longitud) throws Exception {
        mvc.perform(post("/api/v1/solicitudes/10/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content("{\"comentario\":\"" + "a".repeat(longitud) + "\"}"))
                .andExpect(status().isCreated());
        verify(service).crear(10L, actor, new ComentarioCrearRequest("a".repeat(longitud), false));
    }
}
