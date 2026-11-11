package edu.universidad.servicios.usuario.service;

import edu.universidad.servicios.usuario.domain.*;
import edu.universidad.servicios.usuario.dto.*;
import edu.universidad.servicios.usuario.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

@Service
@Validated
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminUsuarioService {
    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final AreaRepository areas;
    private final PasswordEncoder passwords;

    public record Pagina<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}

    @Transactional(readOnly = true)
    public Pagina<UsuarioAdminResponse> listar(String rol, Integer idArea, Boolean activo, String q, int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw error(HttpStatus.BAD_REQUEST, "Paginación inválida (size 1–100)");
        if (rol != null && !rol.isBlank()) validarRol(rol);
        Specification<Usuario> filtro = (root, query, cb) -> {
            var condiciones = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (rol != null && !rol.isBlank()) condiciones.add(root.get("rol").get("nombre").in(rol, "ROLE_" + rol));
            if (idArea != null) condiciones.add(cb.equal(root.get("area").get("id"), idArea));
            if (activo != null) condiciones.add(cb.equal(root.get("activo"), activo));
            if (q != null && !q.isBlank()) {
                String texto = "%" + q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                condiciones.add(cb.or(java.util.stream.Stream.of("nombre", "apellido", "correo", "codigoInstitucional")
                    .map(c -> cb.like(cb.lower(root.get(c)), texto, '\\')).toArray(jakarta.persistence.criteria.Predicate[]::new)));
            }
            return cb.and(condiciones.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var resultado = usuarios.findAll(filtro, PageRequest.of(page, size, Sort.by("id")));
        return new Pagina<>(resultado.map(UsuarioAdminResponse::from).getContent(), page, size, resultado.getTotalElements(), resultado.getTotalPages());
    }

    @Transactional(readOnly = true)
    public UsuarioAdminResponse obtener(Long id) {
        return UsuarioAdminResponse.from(usuarios.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Usuario no encontrado")));
    }

    public UsuarioAdminResponse crear(@NotNull @Valid UsuarioCrearRequest datos, Long actor) {
        bloquearAdministracion();
        String correo = datos.getCorreo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoIgnoreCase(correo) || usuarios.existsByCodigoInstitucional(datos.getCodigoInstitucional()))
            throw error(HttpStatus.CONFLICT, "Correo o código institucional ya registrado");
        Usuario u = new Usuario();
        u.setCodigoInstitucional(datos.getCodigoInstitucional());
        u.setCorreo(correo);
        u.setPasswordHash(passwords.encode(datos.getPassword()));
        aplicar(u, datos);
        guardar(u);
        auditar("alta", actor, u.getId(), true);
        return UsuarioAdminResponse.from(u);
    }

    public UsuarioAdminResponse actualizar(Long id, @NotNull @Valid UsuarioActualizarRequest datos, Long actor) {
        bloquearAdministracion();
        Usuario u = bloquearUsuario(id);
        String anterior = codigoRol(u);
        if (Boolean.TRUE.equals(u.getActivo()) && anterior.equals("ADMIN") && !datos.getRol().equals("ADMIN")) protegerUltimoAdmin();
        aplicar(u, datos);
        guardar(u);
        auditar("edicion", actor, id, !anterior.equals(codigoRol(u)));
        return UsuarioAdminResponse.from(u);
    }

    public void desactivar(Long id, Long actor) {
        bloquearAdministracion();
        Usuario u = bloquearUsuario(id);
        if (Objects.equals(id, actor)) throw error(HttpStatus.CONFLICT, "No puede desactivarse a sí mismo");
        boolean cambio = Boolean.TRUE.equals(u.getActivo());
        if (cambio && codigoRol(u).equals("ADMIN")) protegerUltimoAdmin();
        u.setActivo(false);
        guardar(u);
        auditar("baja", actor, id, cambio);
    }

    public UsuarioAdminResponse reactivar(Long id, Long actor) {
        bloquearAdministracion();
        Usuario u = bloquearUsuario(id);
        validarRolArea(codigoRol(u), u.getArea() == null ? null : u.getArea().getId());
        boolean cambio = !Boolean.TRUE.equals(u.getActivo());
        u.setActivo(true);
        guardar(u);
        auditar("reactivacion", actor, id, cambio);
        return UsuarioAdminResponse.from(u);
    }

    private void aplicar(Usuario u, UsuarioActualizarRequest d) {
        validarRol(d.getRol());
        Area area = validarRolArea(d.getRol(), d.getIdArea());
        Rol rol = roles.findByNombre("ROLE_" + d.getRol()).or(() -> roles.findByNombre(d.getRol()))
            .orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "Rol no encontrado"));
        u.setNombre(d.getNombre().trim());
        u.setApellido(d.getApellido().trim());
        u.setTelefono(d.getTelefono() == null ? null : d.getTelefono().trim());
        u.setRol(rol);
        u.setArea(area);
    }

    private Area validarRolArea(String rol, Integer idArea) {
        boolean requiere = rol.equals("TECNICO") || rol.equals("SUPERVISOR");
        if (requiere != (idArea != null)) throw error(HttpStatus.BAD_REQUEST, "Área incoherente con el rol");
        if (idArea == null) return null;
        // Only the destination area is needed; the lock is retained until transaction completion.
        Area area = areas.findByIdForUpdate(idArea).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Área no encontrada"));
        if (!Boolean.TRUE.equals(area.getActivo())) throw error(HttpStatus.CONFLICT, "El área debe estar activa");
        return area;
    }

    private void validarRol(String rol) {
        if (!Set.of("ADMIN", "ESTUDIANTE", "TECNICO", "SUPERVISOR").contains(rol)) throw error(HttpStatus.BAD_REQUEST, "Rol inválido");
    }

    private void bloquearAdministracion() {
        // A stable row serializes membership changes before any user/area locks or snapshot reads.
        if (roles.bloquearAdministracion().isEmpty()) throw new IllegalStateException("No existe el rol ADMIN");
    }

    private Usuario bloquearUsuario(Long id) {
        return usuarios.findByIdForUpdate(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private void protegerUltimoAdmin() {
        if (usuarios.administradoresActivosActuales().size() <= 1) throw error(HttpStatus.CONFLICT, "Debe quedar al menos un administrador activo");
    }

    private void guardar(Usuario u) {
        try { usuarios.saveAndFlush(u); }
        catch (DataIntegrityViolationException ex) {
            throw error(HttpStatus.CONFLICT, "Los datos del usuario entran en conflicto con un registro existente");
        }
    }

    private static String codigoRol(Usuario u) { return u.getRol().getNombre().replaceFirst("^ROLE_", ""); }
    private static ResponseStatusException error(HttpStatus status, String mensaje) { return new ResponseStatusException(status, mensaje); }

    private void auditar(String operacion, Long actor, Long id, boolean seguridad) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                log.info("administracion operacion={} actor={} usuarioId={}", operacion, actor, id);
                if (seguridad) log.warn("administracion cambioRolEstado operacion={} actor={} usuarioId={}", operacion, actor, id);
            }
        });
    }
}
