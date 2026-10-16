package edu.universidad.servicios.usuario.dto;

public record TecnicoResponse(
        Long id,
        String codigoInstitucional,
        String nombre,
        String apellido,
        String correo,
        String telefono,
        Integer idArea,
        String nombreArea,
        Boolean activo,
        Long cargaActual
) {
}
