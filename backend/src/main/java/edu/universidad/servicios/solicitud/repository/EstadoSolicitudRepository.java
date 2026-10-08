package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EstadoSolicitudRepository extends JpaRepository<EstadoSolicitud, String> {

    List<EstadoSolicitud> findAllByOrderByOrdenAsc();
}
