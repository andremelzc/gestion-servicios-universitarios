package edu.universidad.servicios.auth.service;

import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        // 1. Spring Security AuthenticationManager verificará la contraseña con BCrypt
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        // 2. Si pasa, buscamos el usuario para generar su token y actualizar su último acceso
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado post-autenticación"));

        // TODO: En un issue futuro de seguridad (US-20), resetear intentos fallidos aquí.
        
        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // 3. Generar token
        String jwtToken = jwtService.generateToken(usuario);

        return AuthResponse.builder()
                .token(jwtToken)
                .tipo("Bearer")
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().getNombre())
                .idArea(usuario.getArea() != null ? usuario.getArea().getId() : null)
                .build();
    }
}
