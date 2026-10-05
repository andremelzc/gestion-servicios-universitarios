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
}
