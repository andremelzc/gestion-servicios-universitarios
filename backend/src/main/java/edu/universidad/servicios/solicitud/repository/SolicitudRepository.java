package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long>, JpaSpecificationExecutor<Solicitud> {

    Optional<Solicitud> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    @Query("""
        SELECT s FROM Solicitud s
        JOIN FETCH s.categoria c
        JOIN FETCH c.area
        JOIN FETCH s.prioridad
        JOIN FETCH s.estado
        JOIN FETCH s.solicitante
        LEFT JOIN FETCH s.tecnicoAsignado
        LEFT JOIN FETCH s.supervisorAsignador
        WHERE s.id = :id
    """)
    Optional<Solicitud> findByIdConDetalles(Long id);

    @Query("""
        SELECT new edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse(
            s.id,
            s.codigo,
            s.titulo,
            c.nombre,
            p.nivel,
            e.codigo,
            e.nombreVisible,
            e.colorHex,
            CASE WHEN t IS NOT NULL THEN CONCAT(t.nombre, ' ', t.apellido) ELSE null END,
            s.fechaRegistro,
            s.fechaLimiteSla
        )
        FROM Solicitud s
        JOIN s.categoria c
        JOIN s.prioridad p
        JOIN s.estado e
        LEFT JOIN s.tecnicoAsignado t
        WHERE s.solicitante.id = :usuarioId
        ORDER BY s.fechaRegistro DESC
    """)
    Page<SolicitudResumenResponse> findResumenBySolicitanteId(Long usuarioId, Pageable pageable);
}
