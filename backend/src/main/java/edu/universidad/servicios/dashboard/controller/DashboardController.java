package edu.universidad.servicios.dashboard.controller;

import edu.universidad.servicios.auth.security.UsuarioDetails;
import edu.universidad.servicios.dashboard.dto.KpisResponse;
import edu.universidad.servicios.dashboard.dto.SerieEstadoItem;
import edu.universidad.servicios.dashboard.dto.SerieItem;
import edu.universidad.servicios.dashboard.service.DashboardService;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import edu.universidad.servicios.usuario.domain.Usuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasAnyRole('TECNICO', 'SUPERVISOR', 'ADMIN')")
@Tag(
	name = "Dashboard",
	description = "Indicadores operativos según el alcance del usuario autenticado"
)
@SecurityScheme(
	name = "bearerAuth",
	type = SecuritySchemeType.HTTP,
	scheme = "bearer",
	bearerFormat = "JWT"
)
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

	private final DashboardService dashboardService;

	public DashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping("/kpis")
	@Operation(
		summary = "Obtener indicadores de solicitudes y tiempo promedio de atención"
	)
	public KpisResponse kpis(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.kpis(actor(principal), desde, hasta, idArea);
	}

	@GetMapping("/por-categoria")
	@Operation(summary = "Distribución de solicitudes por categoría")
	public List<SerieItem> porCategoria(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.porCategoria(
			actor(principal),
			desde,
			hasta,
			idArea
		);
	}

	@GetMapping("/por-prioridad")
	@Operation(
		summary = "Distribución de solicitudes por prioridad, incluyendo prioridades sin solicitudes"
	)
	public List<SerieItem> porPrioridad(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.porPrioridad(
			actor(principal),
			desde,
			hasta,
			idArea
		);
	}

	@GetMapping("/por-estado")
	@Operation(summary = "Distribución de solicitudes por estado y color")
	public List<SerieEstadoItem> porEstado(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.porEstado(
			actor(principal),
			desde,
			hasta,
			idArea
		);
	}

	@GetMapping("/por-responsable")
	@Operation(summary = "Distribución de solicitudes por técnico asignado")
	public List<SerieItem> porResponsable(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.porResponsable(
			actor(principal),
			desde,
			hasta,
			idArea
		);
	}

	@GetMapping("/vencidas")
	@Operation(summary = "Listar solicitudes con SLA vencido por mayor retraso")
	public Page<SolicitudResumenResponse> vencidas(
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate desde,
		@RequestParam(required = false) @DateTimeFormat(
			iso = DateTimeFormat.ISO.DATE
		) LocalDate hasta,
		@RequestParam(required = false) Integer idArea,
		@PageableDefault(size = 20) Pageable pageable,
		@AuthenticationPrincipal UsuarioDetails principal
	) {
		return dashboardService.vencidas(
			actor(principal),
			desde,
			hasta,
			idArea,
			pageable
		);
	}

	private Usuario actor(UsuarioDetails principal) {
		return principal == null ? null : principal.getUsuario();
	}
}
