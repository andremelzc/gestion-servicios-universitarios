package edu.universidad.servicios.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class TraceIdFilterTest {

    private TraceIdFilter traceIdFilter;

    @BeforeEach
    void setUp() {
        traceIdFilter = new TraceIdFilter();
        MDC.clear();
    }

    @Test
    @DisplayName("Debe generar traceId de 32 caracteres cuando la petición no incluye cabeceras de traza")
    void testGeneraTraceIdCuandoNoHayCabeceras() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> mdcTraceIdInsideChain = new AtomicReference<>();

        FilterChain filterChain = (req, res) -> {
            mdcTraceIdInsideChain.set(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        String headerTraceId = response.getHeader(TraceIdFilter.TRACE_ID_HEADER);
        assertThat(headerTraceId).isNotNull().hasSize(32);
        assertThat(mdcTraceIdInsideChain.get()).isEqualTo(headerTraceId);
        assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("Debe reutilizar X-Trace-Id cuando está presente en la petición")
    void testReutilizaXTraceIdHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        String customTraceId = "mi-trace-personalizado-123";
        request.addHeader(TraceIdFilter.TRACE_ID_HEADER, customTraceId);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcTraceIdInsideChain = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> {
            mdcTraceIdInsideChain.set(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        assertThat(response.getHeader(TraceIdFilter.TRACE_ID_HEADER)).isEqualTo(customTraceId);
        assertThat(mdcTraceIdInsideChain.get()).isEqualTo(customTraceId);
        assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("Debe extraer traceId desde cabecera W3C traceparent válida")
    void testExtraeTraceIdDesdeW3cTraceparent() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        String traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
        String traceparent = "00-" + traceId + "-00f067aa0ba902b7-01";
        request.addHeader(TraceIdFilter.TRACEPARENT_HEADER, traceparent);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcTraceIdInsideChain = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> {
            mdcTraceIdInsideChain.set(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        assertThat(response.getHeader(TraceIdFilter.TRACE_ID_HEADER)).isEqualTo(traceId);
        assertThat(mdcTraceIdInsideChain.get()).isEqualTo(traceId);
        assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("Debe generar nuevo traceId si el formato de W3C traceparent es inválido")
    void testFallbackCuandoW3cTraceparentEsInvalido() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(TraceIdFilter.TRACEPARENT_HEADER, "formato-invalido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcTraceIdInsideChain = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> {
            mdcTraceIdInsideChain.set(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        String headerTraceId = response.getHeader(TraceIdFilter.TRACE_ID_HEADER);
        assertThat(headerTraceId).isNotNull().hasSize(32);
        assertThat(mdcTraceIdInsideChain.get()).isEqualTo(headerTraceId);
        assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isNull();
    }
}
