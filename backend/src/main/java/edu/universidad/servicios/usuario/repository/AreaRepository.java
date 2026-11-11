package edu.universidad.servicios.usuario.repository;

import edu.universidad.servicios.usuario.domain.Area;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaRepository extends JpaRepository<Area, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Area a where a.id = :id")
    Optional<Area> findByIdForUpdate(@Param("id") Integer id);

    Optional<Area> findByNombre(String nombre);
    Optional<Area> findByNombreIgnoreCase(String nombre);
    List<Area> findAllByActivoTrue();
}
