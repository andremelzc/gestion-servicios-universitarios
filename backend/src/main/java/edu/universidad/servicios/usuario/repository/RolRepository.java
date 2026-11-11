package edu.universidad.servicios.usuario.repository;

import edu.universidad.servicios.usuario.domain.Rol;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {
    Optional<Rol> findByNombre(String nombre);

    @org.springframework.data.jpa.repository.Lock(
        jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
    )
    @org.springframework.data.jpa.repository.Query(
        "select r from Rol r where r.nombre = 'ROLE_ADMIN' or r.nombre = 'ADMIN' order by r.id"
    )
    java.util.List<Rol> bloquearAdministracion();
}
