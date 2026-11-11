package edu.universidad.servicios.usuario.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.Level;
import ch.qos.logback.core.read.ListAppender;
import ch.qos.logback.classic.spi.ILoggingEvent;
import edu.universidad.servicios.usuario.domain.*;
import edu.universidad.servicios.usuario.dto.*;
import edu.universidad.servicios.usuario.repository.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.*;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminUsuarioServiceTest {
    @Mock UsuarioRepository usuarios;
    @Mock RolRepository roles;
    @Mock AreaRepository areas;
    @Mock PasswordEncoder encoder;
    @InjectMocks AdminUsuarioService servicio;
    Rol admin, tecnico;
    Usuario u;
    Logger logger;
    ListAppender<ILoggingEvent> logs;

    @BeforeEach void preparar() {
        admin = new Rol(); admin.setId(4); admin.setNombre("ROLE_ADMIN");
        tecnico = new Rol(); tecnico.setId(2); tecnico.setNombre("ROLE_TECNICO");
        u = new Usuario(); u.setId(20L); u.setRol(admin); u.setActivo(true);
        when(roles.bloquearAdministracion()).thenReturn(List.of(admin));
        TransactionSynchronizationManager.initSynchronization();
        logger = (Logger) LoggerFactory.getLogger(AdminUsuarioService.class);
        logs = new ListAppender<>(); logs.start(); logger.addAppender(logs);
    }
    @AfterEach void limpiar() {
        TransactionSynchronizationManager.clearSynchronization();
        logger.detachAppender(logs); logs.stop();
    }
    UsuarioCrearRequest datos(String rol, Integer area) {
        var d = new UsuarioCrearRequest(); d.setNombre("Lucia"); d.setApellido("Torres");
        d.setCorreo("lucia@universidad.edu"); d.setCodigoInstitucional("COD12345"); d.setPassword("Secreta123");
        d.setRol(rol); d.setIdArea(area); return d;
    }
    @Test void altaHasheaBloqueaAreaYAuditaSoloTrasCommitSinSensibles() {
        Area a = new Area(); a.setId(3);
        when(areas.findByIdForUpdate(3)).thenReturn(Optional.of(a));
        when(roles.findByNombre("ROLE_TECNICO")).thenReturn(Optional.of(tecnico));
        when(encoder.encode("Secreta123")).thenReturn("HASH");
        doAnswer(inv -> { ((Usuario) inv.getArgument(0)).setId(31L); return inv.getArgument(0); }).when(usuarios).saveAndFlush(any());
        var response = servicio.crear(datos("TECNICO", 3), 10L);
        assertThat(response.rol()).isEqualTo("TECNICO");
        var captor = ArgumentCaptor.forClass(Usuario.class); verify(usuarios).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("HASH");
        InOrder orden = inOrder(roles, areas, usuarios);
        orden.verify(roles).bloquearAdministracion(); orden.verify(areas).findByIdForUpdate(3); orden.verify(usuarios).saveAndFlush(any());
        assertThat(logs.list).isEmpty();
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        assertThat(logs.list).extracting(ILoggingEvent::getLevel).containsExactly(Level.INFO, Level.WARN);
        assertThat(logs.list).allSatisfy(e -> assertThat(e.getFormattedMessage()).contains("actor=10", "usuarioId=31").doesNotContain("lucia", "Secreta", "HASH", "COD12345"));
    }
    @Test void rollbackNoEmiteAuditoria() {
        when(usuarios.findByIdForUpdate(20L)).thenReturn(Optional.of(u));
        when(usuarios.administradoresActivosActuales()).thenReturn(List.of(20L, 30L));
        servicio.desactivar(20L, 10L);
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        assertThat(logs.list).isEmpty();
    }
    @Test void autoBajaProhibida() {
        when(usuarios.findByIdForUpdate(20L)).thenReturn(Optional.of(u));
        assertThatThrownBy(() -> servicio.desactivar(20L, 20L)).isInstanceOf(ResponseStatusException.class);
        verify(usuarios, never()).saveAndFlush(any());
    }
    @Test void ultimoAdminNoSeDesactivaNiSeDegrada() {
        when(usuarios.findByIdForUpdate(20L)).thenReturn(Optional.of(u));
        when(usuarios.administradoresActivosActuales()).thenReturn(List.of(20L));
        assertThatThrownBy(() -> servicio.desactivar(20L, 10L)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> servicio.actualizar(20L, datos("ESTUDIANTE", null), 10L)).isInstanceOf(ResponseStatusException.class);
        verify(usuarios, never()).saveAndFlush(any());
    }
    @Test void areaInactivaImpideAltaEdicionYReactivacion() {
        Area a = new Area(); a.setId(3); a.setActivo(false);
        when(areas.findByIdForUpdate(3)).thenReturn(Optional.of(a));
        when(usuarios.findByIdForUpdate(20L)).thenReturn(Optional.of(u));
        u.setRol(tecnico); u.setArea(a); u.setActivo(false);
        assertThatThrownBy(() -> servicio.crear(datos("TECNICO", 3), 10L)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> servicio.actualizar(20L, datos("SUPERVISOR", 3), 10L)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> servicio.reactivar(20L, 10L)).isInstanceOf(ResponseStatusException.class);
        verify(usuarios, never()).saveAndFlush(any());
    }
    @Test void rn21RechazaTodosLosRolesIncoherentes() {
        for (String rol : List.of("TECNICO", "SUPERVISOR", "ESTUDIANTE", "ADMIN")) {
            Integer area = rol.equals("TECNICO") || rol.equals("SUPERVISOR") ? null : 3;
            assertThatThrownBy(() -> servicio.crear(datos(rol, area), 10L)).isInstanceOf(ResponseStatusException.class);
        }
        verify(usuarios, never()).saveAndFlush(any());
    }
    @Test void correoDuplicadoRechazadoAntesDeGuardar() {
        when(usuarios.existsByCorreoIgnoreCase("lucia@universidad.edu")).thenReturn(true);
        assertThatThrownBy(() -> servicio.crear(datos("ESTUDIANTE", null), 10L)).isInstanceOf(ResponseStatusException.class);
        verify(usuarios, never()).saveAndFlush(any());
    }
}
