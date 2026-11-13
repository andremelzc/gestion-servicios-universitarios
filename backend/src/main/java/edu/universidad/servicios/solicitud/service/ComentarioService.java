package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.ComentarioSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.dto.ComentarioCrearRequest;
import edu.universidad.servicios.solicitud.dto.ComentarioResponse;
import edu.universidad.servicios.solicitud.repository.ComentarioRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Usuario;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Validated
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComentarioService {
    private final ComentarioRepository comentarioRepository;
    private final SolicitudRepository solicitudRepository;
    private final AccessPolicy accessPolicy;
    private final Clock clock;

    public List<ComentarioResponse> listar(Long id, Usuario actor) {
        obtenerVisible(id, actor);
        return comentarioRepository.findVisibles(id, esInterno(actor)).stream()
                .map(ComentarioResponse::de).toList();
    }

    @Transactional
    public ComentarioResponse crear(Long id, Usuario actor, @Valid ComentarioCrearRequest request) {
        Solicitud solicitud = obtenerVisible(id, actor);
        if (request.privado() && !esInterno(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los comentarios privados son solo para personal interno");
        }
        if ("CERRADA".equals(solicitud.getEstado().getCodigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede comentar en una solicitud cerrada");
        }
        ComentarioSolicitud comentario = new ComentarioSolicitud();
        comentario.setSolicitud(solicitud);
        comentario.setUsuario(actor);
        comentario.setComentario(request.comentario());
        comentario.setPrivado(request.privado());
        comentario.setFechaComentario(LocalDateTime.now(clock));
        return ComentarioResponse.de(comentarioRepository.save(comentario));
    }

    private Solicitud obtenerVisible(Long id, Usuario actor) {
        Solicitud solicitud = solicitudRepository.findByIdConDetalles(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
        if (!accessPolicy.puedeVer(actor, solicitud)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }
        return solicitud;
    }

    private boolean esInterno(Usuario actor) {
        if (actor == null || actor.getRol() == null || actor.getRol().getNombre() == null) return false;
        String rol = actor.getRol().getNombre().toUpperCase(Locale.ROOT).replace("ROLE_", "").trim();
        return Set.of("TECNICO", "SUPERVISOR", "ADMIN").contains(rol);
    }
}
