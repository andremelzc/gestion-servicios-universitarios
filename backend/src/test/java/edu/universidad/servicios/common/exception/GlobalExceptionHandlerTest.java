package edu.universidad.servicios.common.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import edu.universidad.servicios.common.filter.TraceIdFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        MDC.clear();
    }

    @AfterEach
    void cleanUp() {
        MDC.clear();
    }

    @RestController
    static class ControladorConFallo {

        @GetMapping("/fallo")
        void fallo() {
            throw new IllegalStateException(
                "SQL SELECT password FROM usuarios",
                new RuntimeException("secreto-interno")
            );
        }

        @GetMapping("/fallo-status")
        void falloStatus() {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "credencial-interna"
            );
        }

        @GetMapping("/fallo-integridad")
        void falloIntegridad() {
            throw new DataIntegrityViolationException("constraint privada");
        }
    }

    @Test
    @DisplayName(
        "CA-1 / TC-028: respuesta HTTP genérica correlacionada con log y stacktrace"
    )
    void falloHttpNoExponeInformacionSensible() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(
            GlobalExceptionHandler.class
        );
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new ControladorConFallo()
            )
                .setControllerAdvice(exceptionHandler)
                .addFilters(new TraceIdFilter())
                .build();
            String traceId = "0123456789abcdef0123456789abcdef";
            MvcResult result = mvc
                .perform(get("/fallo").header("X-Trace-Id", traceId))
                .andExpect(status().isInternalServerError())
                .andExpect(
                    content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_PROBLEM_JSON
                    )
                )
                .andExpect(header().string("X-Trace-Id", traceId))
                .andExpect(jsonPath("$.traceId").value(traceId))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.title").value("Error Interno"))
                .andExpect(
                    jsonPath("$.detail").value(
                        "Ha ocurrido un error inesperado en el servidor."
                    )
                )
                .andExpect(jsonPath("$.timestamp").exists())
                .andReturn();
            assertThat(
                result.getResponse().getContentAsString()
            ).doesNotContain(
                "SQL",
                "password",
                "usuarios",
                "secreto-interno",
                "IllegalStateException",
                "stackTrace",
                "ControladorConFallo"
            );
            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getLevel()).isEqualTo(Level.ERROR);
            assertThat(event.getFormattedMessage()).contains(traceId);
            assertThat(event.getMDCPropertyMap()).containsEntry(
                "traceId",
                traceId
            );
            assertThat(event.getThrowableProxy()).isNotNull();
            assertThat(event.getThrowableProxy().getClassName()).isEqualTo(
                IllegalStateException.class.getName()
            );
            assertThat(
                event.getThrowableProxy().getCause().getMessage()
            ).isEqualTo("secreto-interno");
            assertThat(
                event.getThrowableProxy().getStackTraceElementProxyArray()
            ).isNotEmpty();
            assertThat(MDC.get("traceId")).isNull();
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void erroresInternosEspecializadosNoExponenDetalles() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ControladorConFallo())
            .setControllerAdvice(exceptionHandler)
            .addFilters(new TraceIdFilter())
            .build();
        for (String path : new String[] {
            "/fallo-status",
            "/fallo-integridad",
        }) {
            MvcResult result = mvc
                .perform(get(path))
                .andExpect(status().isInternalServerError())
                .andExpect(
                    jsonPath("$.detail").value(
                        "Ha ocurrido un error inesperado en el servidor."
                    )
                )
                .andReturn();
            String traceId = result.getResponse().getHeader("X-Trace-Id");
            assertThat(traceId).matches("[0-9a-f]{32}");
            assertThat(result.getResponse().getContentAsString())
                .contains(traceId)
                .doesNotContain(
                    "credencial-interna",
                    "constraint privada",
                    "Exception",
                    "stackTrace"
                );
        }
    }

    @Test
    void generaTraceIdCuandoNoHayMdc() {
        ProblemDetail pd = exceptionHandler.handleGlobalException(
            new RuntimeException("detalle privado")
        );
        assertThat(pd.getProperties().get("traceId").toString()).matches(
            "[0-9a-f]{32}"
        );
    }

    @Test
    @DisplayName(
        "CA-1 / TC-028: handleGlobalException debe retornar 500 genérico con traceId de MDC"
    )
    void testHandleGlobalExceptionUsaTraceIdDeMdc() {
        String traceId = "test-trace-id-500-abc";
        MDC.put("traceId", traceId);

        Exception ex = new RuntimeException(
            "Fallo interno crítico que no debe exponerse"
        );
        ProblemDetail pd = exceptionHandler.handleGlobalException(ex);

        assertThat(pd.getStatus()).isEqualTo(
            HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        assertThat(pd.getTitle()).isEqualTo("Error Interno");
        assertThat(pd.getDetail()).isEqualTo(
            "Ha ocurrido un error inesperado en el servidor."
        );
        assertThat(pd.getProperties()).isNotNull();
        assertThat(pd.getProperties().get("traceId")).isEqualTo(traceId);
        assertThat(pd.getProperties().get("timestamp")).isNotNull();
    }

    @Test
    @DisplayName(
        "handleIllegalArgumentException debe retornar 400 con mensaje y traceId"
    )
    void testHandleIllegalArgumentException() {
        MDC.put("traceId", "trace-bad-request");

        IllegalArgumentException ex = new IllegalArgumentException(
            "Parámetro inválido"
        );
        ProblemDetail pd = exceptionHandler.handleIllegalArgumentException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getTitle()).isEqualTo("Petición inválida");
        assertThat(pd.getDetail()).isEqualTo("Parámetro inválido");
        assertThat(pd.getProperties().get("traceId")).isEqualTo(
            "trace-bad-request"
        );
    }

    @Test
    @DisplayName("handleConflictoException debe retornar 409 y traceId")
    void testHandleConflictoException() {
        MDC.put("traceId", "trace-conflict");

        RecursoEnConflictoException ex = new RecursoEnConflictoException(
            "Conflicto en recurso"
        );
        ProblemDetail pd = exceptionHandler.handleConflictoException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getTitle()).isEqualTo("Recurso en conflicto");
        assertThat(pd.getProperties().get("traceId")).isEqualTo(
            "trace-conflict"
        );
    }

    @Test
    @DisplayName("handleAuthenticationException debe retornar 401 y traceId")
    void testHandleAuthenticationException() {
        MDC.put("traceId", "trace-unauthorized");

        BadCredentialsException ex = new BadCredentialsException(
            "Credenciales inválidas"
        );
        ProblemDetail pd = exceptionHandler.handleAuthenticationException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(pd.getTitle()).isEqualTo("No Autenticado");
        assertThat(pd.getProperties().get("traceId")).isEqualTo(
            "trace-unauthorized"
        );
    }

    @Test
    @DisplayName("handleAccessDeniedException debe retornar 403 y traceId")
    void testHandleAccessDeniedException() {
        MDC.put("traceId", "trace-forbidden");

        AccessDeniedException ex = new AccessDeniedException(
            "Acceso no permitido"
        );
        ProblemDetail pd = exceptionHandler.handleAccessDeniedException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(pd.getTitle()).isEqualTo("Acceso Denegado");
        assertThat(pd.getProperties().get("traceId")).isEqualTo(
            "trace-forbidden"
        );
    }
}
