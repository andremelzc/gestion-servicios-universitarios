package edu.universidad.servicios.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.dto.RegistroRequest;
import edu.universidad.servicios.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Registro público de estudiantes (US-02, US-03).
     *
     * <p>Devuelve {@code 201 Created} con auto-login (CA-4).</p>
     * <p>Campos desconocidos como {@code "rol"} disparan {@code 400 Bad Request} (CA-6)
     * gracias al {@link ExceptionHandler} local de {@link HttpMessageNotReadableException}.</p>
     */
    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registro(@Valid @RequestBody RegistroRequest request) {
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Intercepta campos desconocidos como {@code "rol"} en el JSON de registro (CA-6).
     * Jackson por defecto ignora propiedades desconocidas; esta excepción se lanza
     * cuando configuramos {@code FAIL_ON_UNKNOWN_PROPERTIES} en el {@code ObjectMapper}
     * o cuando un campo no se puede mapear.
     *
     * <p>Este manejador local captura específicamente el caso de campos inesperados
     * y devuelve un 400 descriptivo.</p>
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "El cuerpo de la petición contiene campos no permitidos o un formato inválido"
        );
        pd.setTitle("Petición no válida");
        pd.setType(URI.create("https://api.servicios.edu/errors/bad-request"));
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("traceId", UUID.randomUUID().toString());

        // Si la causa es un campo desconocido, detallar cuál
        if (ex.getCause() instanceof UnrecognizedPropertyException upe) {
            pd.setProperty("errores", Map.of(
                    upe.getPropertyName(),
                    "Campo no permitido en esta petición"
            ));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(pd);
    }

    // TODO: Implementar recuperar-password (HU-02)
    @PostMapping("/recuperar-password")
    public ResponseEntity<Void> recuperarPassword() {
        return ResponseEntity.status(501).build(); // Not Implemented
    }

    // TODO: Implementar restablecer-password (HU-02)
    @PostMapping("/restablecer-password")
    public ResponseEntity<Void> restablecerPassword() {
        return ResponseEntity.status(501).build(); // Not Implemented
    }
}
