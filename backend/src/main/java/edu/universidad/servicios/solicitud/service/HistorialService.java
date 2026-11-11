package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.HistorialSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HistorialService {

    private final HistorialSolicitudRepository historialRepository;
    private final SolicitudMetrics metrics;

    public HistorialService(
        HistorialSolicitudRepository historialRepository,
        SolicitudMetrics metrics
    ) {
        this.historialRepository = historialRepository;
        this.metrics = metrics;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(
        Solicitud solicitud,
        Usuario actor,
        EstadoSolicitud anterior,
        EstadoSolicitud nuevo,
        String nota
    ) {
        HistorialSolicitud historial = new HistorialSolicitud();
        historial.setSolicitud(solicitud);
        historial.setUsuario(actor);
        historial.setEstadoAnterior(anterior);
        historial.setEstadoNuevo(nuevo);
        historial.setNota(nota);
        historialRepository.save(historial);
        if (anterior == null) {
            metrics.creada(solicitud);
        } else {
            metrics.transicion(anterior.getCodigo(), nuevo.getCodigo());
        }
    }
}
