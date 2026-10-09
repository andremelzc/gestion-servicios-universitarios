package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    List<Categoria> findByActivoTrueOrderByNombreAsc();

    @Query("SELECT c FROM Categoria c JOIN FETCH c.area WHERE c.id = :id AND c.activo = true")
    Optional<Categoria> findActivaConArea(Integer id);
}
