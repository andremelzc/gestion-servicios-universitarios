package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Prioridad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrioridadRepository extends JpaRepository<Prioridad, Integer> {

    List<Prioridad> findByActivoTrueOrderByPonderadorAsc();

    Optional<Prioridad> findByIdAndActivoTrue(Integer id);
}
