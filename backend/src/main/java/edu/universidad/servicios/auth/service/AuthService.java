package edu.universidad.servicios.auth.service;

import edu.universidad.servicios.auth.dto.AuthResponse;
import edu.universidad.servicios.auth.dto.LoginRequest;
import edu.universidad.servicios.auth.dto.RegistroRequest;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.common.exception.RecursoEnConflictoException;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    /** Nombre del rol forzado en registro público (RN-04). */
    private static final String ROL_ESTUDIANTE = "ROLE_ESTUDIANTE";

    /**
     * Autenticación de usuario existente (US-01).
     * Algoritmo del plan §1.3: mensaje único ante cualquier fallo
     * (prevención de enumeración de cuentas).
     */
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

        return buildAuthResponse(usuario, jwtToken);
    }

    /**
     * Registro público de estudiantes (US-02, US-03, CA-4, CA-6, CA-7).
     *
     * <p>Flujo según plan §1.4:</p>
     * <ol>
     *   <li>Normaliza correo a minúsculas</li>
     *   <li>Verifica unicidad de correo y código institucional (409 si existe)</li>
     *   <li>Hashea contraseña con BCrypt(12)</li>
     *   <li>Crea usuario con rol forzado {@code ROLE_ESTUDIANTE}, activo = true</li>
     *   <li>Devuelve {@link AuthResponse} con JWT (auto-login, misma respuesta que login)</li>
     * </ol>
     */
    @Transactional
    public AuthResponse registrar(RegistroRequest request) {
        // 1. Normalizar correo a minúsculas (RN-02)
        String correoNormalizado = request.getCorreo().trim().toLowerCase();

        // 2. Verificar unicidad (CA-7)
        if (usuarioRepository.existsByCorreo(correoNormalizado)) {
            throw new RecursoEnConflictoException("Ya existe un usuario con ese correo electrónico");
        }
        if (usuarioRepository.existsByCodigoInstitucional(request.getCodigoInstitucional())) {
            throw new RecursoEnConflictoException("Ya existe un usuario con ese código institucional");
        }

        // 3. Obtener rol ESTUDIANTE forzado (RN-04)
        Rol rolEstudiante = rolRepository.findByNombre(ROL_ESTUDIANTE)
                .orElseThrow(() -> {
                    log.error("Rol {} no encontrado en la base de datos. Verificar migración V2.", ROL_ESTUDIANTE);
                    return new IllegalStateException("Configuración del sistema incompleta: rol de estudiante no encontrado");
                });

        // 4. Construir entidad Usuario
        Usuario usuario = new Usuario();
        usuario.setCodigoInstitucional(request.getCodigoInstitucional().trim());
        usuario.setNombre(request.getNombre().trim());
        usuario.setApellido(request.getApellido().trim());
        usuario.setCorreo(correoNormalizado);
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolEstudiante);
        usuario.setActivo(true);
        // area queda null para estudiantes
        // fechaCreacion y fechaActualizacion los pone @PrePersist

        usuarioRepository.save(usuario);
        log.info("Nuevo estudiante registrado: correo={}, código={}", correoNormalizado, request.getCodigoInstitucional());

        // 5. Auto-login: generar JWT y devolver misma respuesta que login (CA-4)
        String jwtToken = jwtService.generateToken(usuario);

        return buildAuthResponse(usuario, jwtToken);
    }

    /**
     * Construye la respuesta de autenticación estandarizada.
     */
    private AuthResponse buildAuthResponse(Usuario usuario, String jwtToken) {
        return AuthResponse.builder()
                .token(jwtToken)
                .tipo("Bearer")
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().getNombre())
                .idArea(usuario.getArea() != null ? usuario.getArea().getId() : null)
                .build();
    }
}
