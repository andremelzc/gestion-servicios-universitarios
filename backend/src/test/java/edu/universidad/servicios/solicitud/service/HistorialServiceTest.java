package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.HistorialSolicitud;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.repository.HistorialSolicitudRepository;
import edu.universidad.servicios.usuario.domain.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class HistorialServiceTest {

    @Mock
    HistorialSolicitudRepository historialRepository;

    @Test
    void registraUnaTransicionSinModificarRegistrosExistentes() {
        Solicitud solicitud = new Solicitud();
        Usuario actor = new Usuario();
        EstadoSolicitud anterior = new EstadoSolicitud();
        EstadoSolicitud nuevo = new EstadoSolicitud();
        HistorialService service = new HistorialService(historialRepository);

        service.registrar(solicitud, actor, anterior, nuevo, "Asignación inicial");

        ArgumentCaptor<HistorialSolicitud> captor = ArgumentCaptor.forClass(HistorialSolicitud.class);
        verify(historialRepository).save(captor.capture());
        HistorialSolicitud historial = captor.getValue();
        assertThat(historial.getSolicitud()).isSameAs(solicitud);
        assertThat(historial.getUsuario()).isSameAs(actor);
        assertThat(historial.getEstadoAnterior()).isSameAs(anterior);
        assertThat(historial.getEstadoNuevo()).isSameAs(nuevo);
        assertThat(historial.getNota()).isEqualTo("Asignación inicial");
        assertThat(historial.getId()).isNull();
    }

    @Test
    void exigeLaTransaccionDeLaOperacionPrincipal() throws NoSuchMethodException {
        Transactional transactional = HistorialService.class.getMethod(
                "registrar", Solicitud.class, Usuario.class, EstadoSolicitud.class,
                EstadoSolicitud.class, String.class
        ).getAnnotation(Transactional.class);

        assertThat(transactional.propagation()).isEqualTo(Propagation.MANDATORY);
    }
}
