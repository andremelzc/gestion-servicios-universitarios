package edu.universidad.servicios.common.exception;

/**
 * Excepción lanzada cuando se intenta crear un recurso que ya existe
 * (correo o código institucional duplicado). El {@link GlobalExceptionHandler}
 * la convierte en una respuesta {@code 409 Conflict} con formato RFC 7807.
 */
public class RecursoEnConflictoException extends RuntimeException {

    public RecursoEnConflictoException(String message) {
        super(message);
    }
}
