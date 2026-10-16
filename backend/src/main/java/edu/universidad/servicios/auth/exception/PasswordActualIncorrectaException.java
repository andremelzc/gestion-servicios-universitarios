package edu.universidad.servicios.auth.exception;

/**
 * Excepción lanzada cuando la contraseña actual no coincide al intentar cambiarla (US-18 / CA-14).
 */
public class PasswordActualIncorrectaException extends RuntimeException {

    public PasswordActualIncorrectaException(String message) {
        super(message);
    }
}
