package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Categoria;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Categoria c where c.id = :id")
    Optional<Categoria> findByIdForUpdate(@Param("id") Integer id);

    List<Categoria> findAllByActivoTrue();

    boolean existsByAreaIdAndActivoTrue(Integer idArea);

    Optional<Categoria> findByNombreIgnoreCase(String nombre);

    @org.springframework.data.jpa.repository.EntityGraph(
        attributePaths = "area"
    )
    List<Categoria> findAll();

    @Query(
        "SELECT c FROM Categoria c JOIN FETCH c.area WHERE c.activo = true ORDER BY c.nombre ASC"
    )
    List<Categoria> findByActivoTrueOrderByNombreAsc();

    @Query(
        "SELECT c FROM Categoria c JOIN FETCH c.area WHERE c.area.id = :idArea AND c.activo = true ORDER BY c.nombre ASC"
    )
    List<Categoria> findByAreaIdAndActivoTrueOrderByNombreAsc(Integer idArea);

    @Query(
        "SELECT c FROM Categoria c JOIN FETCH c.area WHERE c.id = :id AND c.activo = true"
    )
    Optional<Categoria> findActivaConArea(Integer id);
}
