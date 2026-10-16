package edu.universidad.servicios.dashboard.service;

import edu.universidad.servicios.dashboard.dto.KpisResponse;
import edu.universidad.servicios.dashboard.dto.SerieEstadoItem;
import edu.universidad.servicios.dashboard.dto.SerieItem;
import edu.universidad.servicios.dashboard.repository.DashboardKpis;
import edu.universidad.servicios.dashboard.repository.DashboardRepository;
import edu.universidad.servicios.solicitud.dto.SolicitudResumenResponse;
import edu.universidad.servicios.usuario.domain.Usuario;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

    private final DashboardRepository repository;
    private final ScopeResolver scopeResolver;
    private final Clock clock;

    public DashboardService(DashboardRepository repository, ScopeResolver scopeResolver, Clock clock) {
        this.repository = repository;
        this.scopeResolver = scopeResolver;
        this.clock = clock;
    }

    public KpisResponse kpis(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        Filtros filtros = filtros(actor, desde, hasta, idArea);
        DashboardKpis kpis = repository.kpis(filtros.desde(), filtros.hasta(),
            filtros.scope().idArea(), filtros.scope().idTecnico());
        double porcentaje = kpis.registradas() == 0 ? 0 : BigDecimal.valueOf(kpis.atendidas())
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(kpis.registradas()), 1, RoundingMode.HALF_UP)
            .doubleValue();
        return new KpisResponse(
            filtros.desde().atStartOfDay().atOffset(ZoneOffset.UTC),
            filtros.hasta().plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC).minusSeconds(1),
            kpis.registradas(), kpis.pendientes(), kpis.atendidas(), porcentaje,
            kpis.mttrHoras() == null ? null : kpis.mttrHoras().doubleValue(), kpis.vencidas()
        );
    }

    public List<SerieItem> porCategoria(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        Filtros f = filtros(actor, desde, hasta, idArea);
        return repository.porCategoria(f.desde(), f.hasta(), f.scope().idArea(), f.scope().idTecnico());
    }

    public List<SerieItem> porPrioridad(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        Filtros f = filtros(actor, desde, hasta, idArea);
        return repository.porPrioridad(f.desde(), f.hasta(), f.scope().idArea(), f.scope().idTecnico());
    }

    public List<SerieEstadoItem> porEstado(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        Filtros f = filtros(actor, desde, hasta, idArea);
        return repository.porEstado(f.desde(), f.hasta(), f.scope().idArea(), f.scope().idTecnico());
    }

    public List<SerieItem> porResponsable(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        Filtros f = filtros(actor, desde, hasta, idArea);
        return repository.porResponsable(f.desde(), f.hasta(), f.scope().idArea(), f.scope().idTecnico());
    }

    public Page<SolicitudResumenResponse> vencidas(Usuario actor, LocalDate desde, LocalDate hasta,
                                                     Integer idArea, Pageable pageable) {
        Filtros f = filtros(actor, desde, hasta, idArea);
        return repository.vencidas(f.desde(), f.hasta(), f.scope().idArea(), f.scope().idTecnico(), pageable);
    }

    private Filtros filtros(Usuario actor, LocalDate desde, LocalDate hasta, Integer idArea) {
        DashboardScope scope = scopeResolver.resolve(actor, idArea);
        LocalDate fin = hasta == null ? LocalDate.now(clock) : hasta;
        LocalDate inicio = desde == null ? fin.minusDays(29) : desde;
        if (inicio.isAfter(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "desde no puede ser posterior a hasta");
        }
        return new Filtros(inicio, fin, scope);
    }

    private record Filtros(LocalDate desde, LocalDate hasta, DashboardScope scope) {}
}
