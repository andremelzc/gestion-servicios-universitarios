package edu.universidad.servicios.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.CambiarPasswordRequest;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.dto.RegistroRequest;
import edu.universidad.servicios.auth.exception.PasswordActualIncorrectaException;
import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para inicio de sesión, registro y gestión de credenciales")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
            summary = "Iniciar sesión",
            description = "Autentica al usuario con correo y contraseña, retornando token JWT y perfil básico."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Credenciales con formato incorrecto"),
            @ApiResponse(responseCode = "401", description = "Correo o contraseña incorrectos")
    })
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
    @Operation(
            summary = "Registro público de estudiante",
            description = "Permite registrar un nuevo estudiante en el sistema con asignación forzada de ROLE_ESTUDIANTE y login automático."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario registrado exitosamente con auto-login",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de registro inválidos o campo no permitido"),
            @ApiResponse(responseCode = "409", description = "El correo o código institucional ya está registrado")
    })
    public ResponseEntity<AuthResponse> registro(@Valid @RequestBody RegistroRequest request) {
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Intercepta campos desconocidos como {@code "rol"} en el JSON de registro (CA-6).
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

    /**
     * Cambio de contraseña para el usuario autenticado (US-18, CA-14, AUTH-12).
     */
    @PutMapping("/cambiar-password")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Cambiar contraseña",
            description = "Permite al usuario autenticado actualizar su contraseña actual por una nueva que cumpla las políticas de seguridad."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Contraseña cambiada exitosamente"),
            @ApiResponse(responseCode = "400", description = "La contraseña actual es incorrecta o la nueva contraseña no cumple los requisitos"),
            @ApiResponse(responseCode = "401", description = "No autenticado o token vencido")
    })
    public ResponseEntity<Void> cambiarPassword(
            @Valid @RequestBody CambiarPasswordRequest request,
            @AuthenticationPrincipal UsuarioDetails usuarioDetails,
            Authentication authentication
    ) {
        String correo = usuarioDetails != null ? usuarioDetails.getUsername()
                : authentication != null ? authentication.getName()
                : SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;

        if (correo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        authService.cambiarPassword(correo, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Intercepta error de contraseña actual incorrecta devolviendo 400 Bad Request (CA-14).
     */
    @ExceptionHandler(PasswordActualIncorrectaException.class)
    public ResponseEntity<ProblemDetail> handlePasswordActualIncorrecta(PasswordActualIncorrectaException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "La contraseña actual es incorrecta"
        );
        pd.setTitle("Error de validación");
        pd.setType(URI.create("https://api.servicios.edu/errors/validation-error"));
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("traceId", UUID.randomUUID().toString());
        pd.setProperty("errores", Map.of("passwordActual", ex.getMessage()));

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
