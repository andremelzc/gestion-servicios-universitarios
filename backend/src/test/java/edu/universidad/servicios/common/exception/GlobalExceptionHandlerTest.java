package edu.universidad.servicios.common.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        MDC.clear();
    }

    @Test
    @DisplayName("CA-1 / TC-028: handleGlobalException debe retornar 500 genérico con traceId de MDC")
    void testHandleGlobalExceptionUsaTraceIdDeMdc() {
        String traceId = "test-trace-id-500-abc";
        MDC.put("traceId", traceId);

        Exception ex = new RuntimeException("Fallo interno crítico que no debe exponerse");
        ProblemDetail pd = exceptionHandler.handleGlobalException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(pd.getTitle()).isEqualTo("Error Interno");
        assertThat(pd.getDetail()).isEqualTo("Ha ocurrido un error inesperado en el servidor.");
        assertThat(pd.getProperties()).isNotNull();
        assertThat(pd.getProperties().get("traceId")).isEqualTo(traceId);
        assertThat(pd.getProperties().get("timestamp")).isNotNull();
    }

    @Test
    @DisplayName("handleIllegalArgumentException debe retornar 400 con mensaje y traceId")
    void testHandleIllegalArgumentException() {
        MDC.put("traceId", "trace-bad-request");

        IllegalArgumentException ex = new IllegalArgumentException("Parámetro inválido");
        ProblemDetail pd = exceptionHandler.handleIllegalArgumentException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getTitle()).isEqualTo("Petición inválida");
        assertThat(pd.getDetail()).isEqualTo("Parámetro inválido");
        assertThat(pd.getProperties().get("traceId")).isEqualTo("trace-bad-request");
    }

    @Test
    @DisplayName("handleConflictoException debe retornar 409 y traceId")
    void testHandleConflictoException() {
        MDC.put("traceId", "trace-conflict");

        RecursoEnConflictoException ex = new RecursoEnConflictoException("Conflicto en recurso");
        ProblemDetail pd = exceptionHandler.handleConflictoException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getTitle()).isEqualTo("Recurso en conflicto");
        assertThat(pd.getProperties().get("traceId")).isEqualTo("trace-conflict");
    }

    @Test
    @DisplayName("handleAuthenticationException debe retornar 401 y traceId")
    void testHandleAuthenticationException() {
        MDC.put("traceId", "trace-unauthorized");

        BadCredentialsException ex = new BadCredentialsException("Credenciales inválidas");
        ProblemDetail pd = exceptionHandler.handleAuthenticationException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(pd.getTitle()).isEqualTo("No Autenticado");
        assertThat(pd.getProperties().get("traceId")).isEqualTo("trace-unauthorized");
    }

    @Test
    @DisplayName("handleAccessDeniedException debe retornar 403 y traceId")
    void testHandleAccessDeniedException() {
        MDC.put("traceId", "trace-forbidden");

        AccessDeniedException ex = new AccessDeniedException("Acceso no permitido");
        ProblemDetail pd = exceptionHandler.handleAccessDeniedException(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(pd.getTitle()).isEqualTo("Acceso Denegado");
        assertThat(pd.getProperties().get("traceId")).isEqualTo("trace-forbidden");
    }
}
