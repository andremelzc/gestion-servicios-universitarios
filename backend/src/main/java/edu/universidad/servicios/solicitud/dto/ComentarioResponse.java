package edu.universidad.servicios.solicitud.dto;

import edu.universidad.servicios.solicitud.domain.ComentarioSolicitud;
import java.time.LocalDateTime;

public record ComentarioResponse(Long id, String comentario, boolean privado,
                                 String usuario, LocalDateTime fechaComentario) {
    public static ComentarioResponse de(ComentarioSolicitud c) {
        return new ComentarioResponse(c.getId(), c.getComentario(), c.isPrivado(),
                (c.getUsuario().getNombre() + " " + c.getUsuario().getApellido()).trim(),
                c.getFechaComentario());
    }
}
