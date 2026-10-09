package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.HistorialSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistorialSolicitudRepository extends JpaRepository<HistorialSolicitud, Long> {

    @Query("""
        SELECT h FROM HistorialSolicitud h
        JOIN FETCH h.usuario
        LEFT JOIN FETCH h.estadoAnterior
        JOIN FETCH h.estadoNuevo
        WHERE h.solicitud.id = :solicitudId
        ORDER BY h.fechaCambio ASC
    """)
    List<HistorialSolicitud> findBySolicitudIdConDetalles(Long solicitudId);
}
