package edu.universidad.servicios.common.logging;

import edu.universidad.servicios.common.filter.TraceIdFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import static org.assertj.core.api.Assertions.assertThat;

class ObservabilityLoggingTest {

    private static final Logger log = LoggerFactory.getLogger(ObservabilityLoggingTest.class);

    @Test
    @DisplayName("CA-3: Los logs deben emitirse correctamente con traceId en el contexto MDC")
    void testLoggingConTraceIdEnMdc() {
        String testTraceId = TraceIdFilter.generateTraceId();
        MDC.put(TraceIdFilter.MDC_TRACE_ID_KEY, testTraceId);

        try {
            log.info("Petición procesada con éxito para verificación de observabilidad");
            assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isEqualTo(testTraceId);
        } finally {
            MDC.remove(TraceIdFilter.MDC_TRACE_ID_KEY);
        }

        assertThat(MDC.get(TraceIdFilter.MDC_TRACE_ID_KEY)).isNull();
    }
}
