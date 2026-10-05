package edu.universidad.servicios.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Petición inválida");
        pd.setType(URI.create("https://api.servicios.edu/errors/bad-request"));
        addCommonProperties(pd);
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Existen errores de validación en la solicitud.");
        pd.setTitle("Error de validación");
        pd.setType(URI.create("https://api.servicios.edu/errors/validation-error"));
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        pd.setProperty("errores", errors);
        addCommonProperties(pd);
        return pd;
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "No está autenticado o sus credenciales son inválidas.");
        pd.setTitle("No Autenticado");
        pd.setType(URI.create("https://api.servicios.edu/errors/unauthorized"));
        addCommonProperties(pd);
        return pd;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDeniedException(AccessDeniedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "No tiene permisos suficientes para realizar esta acción.");
        pd.setTitle("Acceso Denegado");
        pd.setType(URI.create("https://api.servicios.edu/errors/forbidden"));
        addCommonProperties(pd);
        return pd;
    }

    @ExceptionHandler(RecursoEnConflictoException.class)
    public ProblemDetail handleConflictoException(RecursoEnConflictoException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Recurso en conflicto");
        pd.setType(URI.create("https://api.servicios.edu/errors/conflict"));
        addCommonProperties(pd);
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGlobalException(Exception ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Ha ocurrido un error inesperado en el servidor.");
        pd.setTitle("Error Interno");
        pd.setType(URI.create("https://api.servicios.edu/errors/internal-server-error"));
        addCommonProperties(pd);
        // NOTA: Para producción, se puede registrar el ex.getMessage() en los logs con el traceId.
        return pd;
    }

    private void addCommonProperties(ProblemDetail pd) {
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("traceId", UUID.randomUUID().toString());
    }
}
