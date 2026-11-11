package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Prioridad;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrioridadRepository extends JpaRepository<Prioridad, Integer> {
    List<Prioridad> findAllByActivoTrue();

    Optional<Prioridad> findByNivelIgnoreCase(String nivel);

    List<Prioridad> findByActivoTrueOrderByPonderadorAsc();

    Optional<Prioridad> findByIdAndActivoTrue(Integer id);
}
