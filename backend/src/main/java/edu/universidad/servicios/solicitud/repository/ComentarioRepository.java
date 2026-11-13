package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.ComentarioSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComentarioRepository extends JpaRepository<ComentarioSolicitud, Long> {
    @Query("""
        SELECT c FROM ComentarioSolicitud c JOIN FETCH c.usuario
        WHERE c.solicitud.id = :id AND (:interno = true OR c.privado = false)
        ORDER BY c.fechaComentario ASC, c.id ASC
        """)
    List<ComentarioSolicitud> findVisibles(@Param("id") Long id, @Param("interno") boolean interno);
}
