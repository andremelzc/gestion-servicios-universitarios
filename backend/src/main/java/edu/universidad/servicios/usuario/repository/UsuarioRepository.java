package edu.universidad.servicios.usuario.repository;

import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    Optional<Usuario> findByCorreo(String correo);
    
    Optional<Usuario> findByCodigoInstitucional(String codigoInstitucional);
    
    boolean existsByCorreo(String correo);
    
    boolean existsByCodigoInstitucional(String codigoInstitucional);

    @org.springframework.data.jpa.repository.Query("""
        SELECT u FROM Usuario u
        JOIN FETCH u.rol r
        LEFT JOIN FETCH u.area a
        WHERE r.nombre IN ('ROLE_TECNICO', 'TECNICO')
          AND u.activo = true
          AND (:areaId IS NULL OR (a IS NOT NULL AND a.id = :areaId))
        ORDER BY u.nombre ASC, u.apellido ASC
    """)
    java.util.List<Usuario> findTecnicosActivosPorArea(@org.springframework.data.repository.query.Param("areaId") Integer areaId);
}
