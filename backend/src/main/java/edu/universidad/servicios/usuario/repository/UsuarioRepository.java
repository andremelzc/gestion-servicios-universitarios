package edu.universidad.servicios.usuario.repository;

import edu.universidad.servicios.usuario.domain.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository
    extends
        JpaRepository<Usuario, Long>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Usuario>
{
    @org.springframework.data.jpa.repository.EntityGraph(
        attributePaths = { "rol", "area" }
    )
    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByCodigoInstitucional(String codigoInstitucional);

    @org.springframework.data.jpa.repository.Lock(
        jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
    )
    @org.springframework.data.jpa.repository.Query(
        "select u from Usuario u where u.id = :id"
    )
    Optional<Usuario> findByIdForUpdate(
        @org.springframework.data.repository.query.Param("id") Long id
    );

    // Locking reads see the latest committed state even under MySQL REPEATABLE READ.
    @org.springframework.data.jpa.repository.Query(
        value = "SELECT id FROM usuarios WHERE activo = true AND id_rol IN (SELECT id FROM roles WHERE nombre IN ('ADMIN', 'ROLE_ADMIN')) ORDER BY id FOR UPDATE",
        nativeQuery = true
    )
    java.util.List<Long> administradoresActivosActuales();

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByAreaIdAndActivoTrue(Integer areaId);

    boolean existsByCorreo(String correo);

    boolean existsByCodigoInstitucional(String codigoInstitucional);

    @org.springframework.data.jpa.repository.Query(
        """
            SELECT u FROM Usuario u
            JOIN FETCH u.rol r
            LEFT JOIN FETCH u.area a
            WHERE r.nombre IN ('ROLE_TECNICO', 'TECNICO')
              AND u.activo = true
              AND (:areaId IS NULL OR (a IS NOT NULL AND a.id = :areaId))
            ORDER BY u.nombre ASC, u.apellido ASC
        """
    )
    java.util.List<Usuario> findTecnicosActivosPorArea(
        @org.springframework.data.repository.query.Param(
            "areaId"
        ) Integer areaId
    );
}
