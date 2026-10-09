package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.EvidenciaArchivo;
import edu.universidad.servicios.solicitud.domain.TipoEvidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenciaArchivoRepository extends JpaRepository<EvidenciaArchivo, Long> {

    List<EvidenciaArchivo> findBySolicitudIdOrderByFechaSubidaAsc(Long solicitudId);

    List<EvidenciaArchivo> findBySolicitudIdAndTipoEvidenciaOrderByFechaSubidaAsc(Long solicitudId, TipoEvidencia tipoEvidencia);

    Optional<EvidenciaArchivo> findByNombreAlmacenado(String nombreAlmacenado);
}
