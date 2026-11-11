package edu.universidad.servicios.catalogo.service;

import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class EstadoService {

    private final EstadoSolicitudRepository estados;

    @Transactional(readOnly = true)
    public List<EstadoSolicitud> listar() {
        return estados.findAllByOrderByOrdenAsc();
    }

    public EstadoSolicitud actualizarPresentacion(
        String codigo,
        String nombreVisible,
        String descripcion,
        String colorHex
    ) {
        if (
            nombreVisible == null ||
            nombreVisible.isBlank() ||
            nombreVisible.trim().length() > 40 ||
            (descripcion != null && descripcion.length() > 255) ||
            colorHex == null ||
            !colorHex.matches("^#[0-9A-Fa-f]{6}$")
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Presentación de estado inválida"
            );
        }
        EstadoSolicitud estado = estados
            .findById(codigo)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estado no encontrado"
                )
            );
        estado.setNombreVisible(nombreVisible.trim());
        estado.setDescripcion(descripcion);
        estado.setColorHex(colorHex);

        return estados.save(estado);
    }
}
