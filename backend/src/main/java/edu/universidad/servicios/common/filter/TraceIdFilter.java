package edu.universidad.servicios.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Filtro HTTP para correlación distribuida de peticiones (TS-05 / CA-2).
 * Extrae o genera un traceId, lo registra en el MDC de SLF4J y lo inyecta
 * en la cabecera X-Trace-Id de la respuesta.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String TRACEPARENT_HEADER = "traceparent";
    public static final String MDC_TRACE_ID_KEY = "traceId";
    public static final String REQUEST_TRACE_ID_ATTR = "traceId";

    // W3C traceparent formato: 00-{32 hex trace-id}-{16 hex parent-id}-{2 hex flags}
    private static final Pattern W3C_TRACEPARENT_PATTERN =
            Pattern.compile("^00-[0-9a-fA-F]{32}-[0-9a-fA-F]{16}-[0-9a-fA-F]{2}$");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = resolveTraceId(request);

        MDC.put(MDC_TRACE_ID_KEY, traceId);
        request.setAttribute(REQUEST_TRACE_ID_ATTR, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_TRACE_ID_KEY);
        }
    }

    /**
     * Resuelve el traceId a partir de:
     * 1. Cabecera W3C 'traceparent'
     * 2. Cabecera 'X-Trace-Id'
     * 3. Generación automática de un identificador hexadecimal de 32 caracteres
     */
    public String resolveTraceId(HttpServletRequest request) {
        String traceparent = request.getHeader(TRACEPARENT_HEADER);
        if (StringUtils.hasText(traceparent)) {
            traceparent = traceparent.trim();
            if (W3C_TRACEPARENT_PATTERN.matcher(traceparent).matches()) {
                String[] parts = traceparent.split("-");
                if (parts.length >= 2 && StringUtils.hasText(parts[1])) {
                    return parts[1].toLowerCase();
                }
            }
        }

        String xTraceId = request.getHeader(TRACE_ID_HEADER);
        if (StringUtils.hasText(xTraceId)) {
            return xTraceId.trim();
        }

        return generateTraceId();
    }

    public static String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
