package edu.universidad.servicios.usuario.repository;

import edu.universidad.servicios.usuario.domain.Area;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaRepository extends JpaRepository<Area, Integer> {
	Optional<Area> findByNombre(String nombre);
}
