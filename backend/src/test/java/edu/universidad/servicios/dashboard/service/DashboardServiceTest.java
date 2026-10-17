package edu.universidad.servicios.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.universidad.servicios.dashboard.dto.KpisResponse;
import edu.universidad.servicios.dashboard.repository.DashboardKpis;
import edu.universidad.servicios.dashboard.repository.DashboardRepository;
import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class DashboardServiceTest {

	private final DashboardRepository repository = mock(
		DashboardRepository.class
	);
	private final DashboardService service = new DashboardService(
		repository,
		new ScopeResolver(),
		Clock.fixed(Instant.parse("2026-10-16T12:00:00Z"), ZoneOffset.UTC)
	);
	private final LocalDate desde = LocalDate.of(2026, 10, 1);
	private final LocalDate hasta = LocalDate.of(2026, 10, 15);

	@Test
	void calculaPorcentajeConUnDecimalYExponeFechasUtcInclusivas() {
		Usuario admin = usuario("ROLE_ADMIN", 1L, null);
		when(repository.kpis(desde, hasta, null, null)).thenReturn(
			new DashboardKpis(150, 50, 100, new BigDecimal("9.4"), 3)
		);

		KpisResponse respuesta = service.kpis(admin, desde, hasta, null);

		assertThat(respuesta.desde().toString()).isEqualTo("2026-10-01T00:00Z");
		assertThat(respuesta.hasta().toString()).isEqualTo(
			"2026-10-15T23:59:59Z"
		);
		assertThat(respuesta.porcentajeResueltas()).isEqualTo(66.7);
		assertThat(respuesta.mttrHoras()).isEqualTo(9.4);
		assertThat(respuesta.vencidas()).isEqualTo(3);
	}

	@Test
	void sinDatosPorcentajeCeroYMttrNuloConRangoDeTreintaDias() {
		Usuario admin = usuario("ROLE_ADMIN", 1L, null);
		LocalDate inicio = LocalDate.of(2026, 9, 17);
		LocalDate fin = LocalDate.of(2026, 10, 16);
		when(repository.kpis(inicio, fin, null, null)).thenReturn(
			new DashboardKpis(0, 0, 0, null, 0)
		);

		KpisResponse respuesta = service.kpis(admin, null, null, null);

		assertThat(respuesta.registradas()).isZero();
		assertThat(respuesta.porcentajeResueltas()).isZero();
		assertThat(respuesta.mttrHoras()).isNull();
		verify(repository).kpis(inicio, fin, null, null);
	}

	@Test
	void supervisorIgnoraAreaSolicitadaParaTodosLosIndicadores() {
		Usuario supervisor = usuario("ROLE_SUPERVISOR", 4L, 3);
		PageRequest pagina = PageRequest.of(0, 10);
		when(repository.kpis(desde, hasta, 3, null)).thenReturn(
			new DashboardKpis(0, 0, 0, null, 0)
		);

		service.kpis(supervisor, desde, hasta, 999);
		service.porCategoria(supervisor, desde, hasta, 999);
		service.porPrioridad(supervisor, desde, hasta, 999);
		service.porEstado(supervisor, desde, hasta, 999);
		service.porResponsable(supervisor, desde, hasta, 999);
		service.vencidas(supervisor, desde, hasta, 999, pagina);

		verify(repository).kpis(desde, hasta, 3, null);
		verify(repository).porCategoria(desde, hasta, 3, null);
		verify(repository).porPrioridad(desde, hasta, 3, null);
		verify(repository).porEstado(desde, hasta, 3, null);
		verify(repository).porResponsable(desde, hasta, 3, null);
		verify(repository).vencidas(desde, hasta, 3, null, pagina);
	}

	@Test
	void tecnicoSoloConsultaSusAsignadasYAdminPuedeFiltrarArea() {
		Usuario tecnico = usuario("ROLE_TECNICO", 8L, 3);
		when(repository.kpis(desde, hasta, null, 8L)).thenReturn(
			new DashboardKpis(0, 0, 0, null, 0)
		);
		service.kpis(tecnico, desde, hasta, 999);
		verify(repository).kpis(desde, hasta, null, 8L);

		Usuario admin = usuario("ROLE_ADMIN", 1L, null);
		service.porEstado(admin, desde, hasta, 3);
		verify(repository).porEstado(desde, hasta, 3, null);
	}

	@Test
	void rangoInvertidoRespondeBadRequestSinConsultarRepositorio() {
		assertThatThrownBy(() ->
			service.kpis(usuario("ROLE_ADMIN", 1L, null), hasta, desde, null)
		)
			.isInstanceOf(ResponseStatusException.class)
			.extracting("statusCode")
			.isEqualTo(HttpStatus.BAD_REQUEST);
		verifyNoInteractions(repository);
	}

	private Usuario usuario(String nombreRol, Long id, Integer idArea) {
		Rol rol = new Rol();
		rol.setNombre(nombreRol);
		Usuario actor = new Usuario();
		actor.setId(id);
		actor.setRol(rol);
		if (idArea != null) {
			Area area = new Area();
			area.setId(idArea);
			actor.setArea(area);
		}
		return actor;
	}
}
