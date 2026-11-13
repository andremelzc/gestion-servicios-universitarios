package edu.universidad.servicios.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String tipo;
    private String correo;
    private String rol;
    private Integer idArea;
    private UsuarioSesion usuario;

    public record UsuarioSesion(Long id, String nombre, String apellido, String correo,
                                String rol, Integer idArea) {}
}
