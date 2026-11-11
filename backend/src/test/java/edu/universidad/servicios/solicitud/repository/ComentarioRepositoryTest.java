package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.usuario.domain.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
class ComentarioRepositoryTest {
    @Autowired EntityManager em;
    @Autowired ComentarioRepository repository;

    @Test
    void filtraPrivadosAislaSolicitudYOrdenaCronologicamente() {
        Rol rol = new Rol();
        rol.setNombre("ESTUDIANTE");
        em.persist(rol);
        Usuario usuario = new Usuario();
        usuario.setRol(rol);
        usuario.setCodigoInstitucional("E001");
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        usuario.setCorreo("ana@universidad.edu");
        usuario.setPasswordHash("hash");
        em.persist(usuario);
        Area area = new Area();
        area.setNombre("TI");
        area.setCorreoContacto("ti@universidad.edu");
        em.persist(area);
        Categoria categoria = new Categoria();
        categoria.setNombre("Redes");
        categoria.setArea(area);
        em.persist(categoria);
        Prioridad prioridad = new Prioridad();
        prioridad.setNivel("BAJA");
        prioridad.setPonderador(1);
        prioridad.setSlaMaxHoras(72);
        em.persist(prioridad);
        EstadoSolicitud estado = new EstadoSolicitud();
        estado.setCodigo("REGISTRADA");
        estado.setNombreVisible("Registrada");
        estado.setColorHex("#000000");
        estado.setOrden((byte) 1);
        em.persist(estado);
        Solicitud solicitud = solicitud("SOL-1", usuario, categoria, prioridad, estado);
        Solicitud otra = solicitud("SOL-2", usuario, categoria, prioridad, estado);
        LocalDateTime fecha = LocalDateTime.of(2026, 11, 11, 12, 0);
        comentario(solicitud, usuario, "Segundo", false, fecha.plusMinutes(1));
        comentario(solicitud, usuario, "Privado", true, fecha);
        comentario(solicitud, usuario, "Primero", false, fecha);
        comentario(otra, usuario, "Ajeno", false, fecha);
        em.flush();
        em.clear();

        assertThat(repository.findVisibles(solicitud.getId(), false))
                .extracting(ComentarioSolicitud::getComentario).containsExactly("Primero", "Segundo");
        assertThat(repository.findVisibles(solicitud.getId(), true))
                .extracting(ComentarioSolicitud::getComentario).containsExactly("Privado", "Primero", "Segundo");
    }

    private Solicitud solicitud(String codigo, Usuario usuario, Categoria categoria,
                                 Prioridad prioridad, EstadoSolicitud estado) {
        Solicitud s = new Solicitud();
        s.setCodigo(codigo);
        s.setSolicitante(usuario);
        s.setCategoria(categoria);
        s.setPrioridad(prioridad);
        s.setEstado(estado);
        s.setTitulo("Problema de red");
        s.setDescripcion("Sin conexión");
        s.setUbicacionCampus("Central");
        s.setUbicacionAmbiente("Laboratorio");
        em.persist(s);
        return s;
    }

    private void comentario(Solicitud solicitud, Usuario usuario, String texto, boolean privado, LocalDateTime fecha) {
        ComentarioSolicitud c = new ComentarioSolicitud();
        c.setSolicitud(solicitud);
        c.setUsuario(usuario);
        c.setComentario(texto);
        c.setPrivado(privado);
        c.setFechaComentario(fecha);
        repository.save(c);
    }
}
