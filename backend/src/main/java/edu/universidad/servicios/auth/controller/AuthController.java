package edu.universidad.servicios.auth.controller;

import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    
    // TODO: Implementar registro (Issue futuro si se requiere auto-registro)
    @PostMapping("/registro")
    public ResponseEntity<Void> registro() {
        return ResponseEntity.status(501).build(); // Not Implemented
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
