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
}
