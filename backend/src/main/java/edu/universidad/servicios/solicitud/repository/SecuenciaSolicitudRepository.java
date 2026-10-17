package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.SecuenciaSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface SecuenciaSolicitudRepository extends JpaRepository<SecuenciaSolicitud, Short> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SecuenciaSolicitud s WHERE s.anio = :anio")
    Optional<SecuenciaSolicitud> findByAnioWithLock(Short anio);
}
