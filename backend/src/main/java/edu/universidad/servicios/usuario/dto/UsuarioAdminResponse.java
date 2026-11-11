package edu.universidad.servicios.usuario.dto;

import edu.universidad.servicios.usuario.domain.Usuario;

public record UsuarioAdminResponse(Long id, String codigoInstitucional, String nombre,
    String apellido, String correo, String telefono, String rol, Integer idArea, Boolean activo) {
    public static UsuarioAdminResponse from(Usuario u) {
        return new UsuarioAdminResponse(u.getId(), u.getCodigoInstitucional(), u.getNombre(),
            u.getApellido(), u.getCorreo(), u.getTelefono(), u.getRol().getNombre().replaceFirst("^ROLE_", ""),
            u.getArea() == null ? null : u.getArea().getId(), u.getActivo());
    }
}
