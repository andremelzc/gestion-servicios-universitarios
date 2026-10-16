package edu.universidad.servicios.solicitud.repository;

import edu.universidad.servicios.solicitud.domain.Solicitud;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SolicitudSpecification {

    private SolicitudSpecification() {
    }

    public static Specification<Solicitud> conFiltros(
            Long usuarioSolicitanteId,
            String estadoCodigo,
            Integer categoriaId,
            Integer prioridadId,
            String textoBusqueda,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (usuarioSolicitanteId != null) {
                predicates.add(cb.equal(root.get("solicitante").get("id"), usuarioSolicitanteId));
            }

            if (StringUtils.hasText(estadoCodigo)) {
                predicates.add(cb.equal(root.get("estado").get("codigo"), estadoCodigo.trim()));
            }

            if (categoriaId != null) {
                predicates.add(cb.equal(root.get("categoria").get("id"), categoriaId));
            }

            if (prioridadId != null) {
                predicates.add(cb.equal(root.get("prioridad").get("id"), prioridadId));
            }

            if (StringUtils.hasText(textoBusqueda)) {
                String pattern = "%" + textoBusqueda.trim().toLowerCase() + "%";
                Predicate porCodigo = cb.like(cb.lower(root.get("codigo")), pattern);
                Predicate porTitulo = cb.like(cb.lower(root.get("titulo")), pattern);
                Predicate porDescripcion = cb.like(cb.lower(root.get("descripcion")), pattern);
                predicates.add(cb.or(porCodigo, porTitulo, porDescripcion));
            }

            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaRegistro"), fechaDesde));
            }

            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaRegistro"), fechaHasta));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Solicitud> paraBandeja(
            Long tecnicoAsignadoId,
            Integer areaCategoriaId,
            List<String> estados,
            Integer prioridadId,
            Integer categoriaId,
            Long filtroTecnicoId,
            String textoBusqueda,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta,
            Boolean soloVencidas,
            LocalDateTime ahora
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (tecnicoAsignadoId != null) {
                predicates.add(cb.equal(root.get("tecnicoAsignado").get("id"), tecnicoAsignadoId));
            }

            if (areaCategoriaId != null) {
                predicates.add(cb.equal(root.get("categoria").get("area").get("id"), areaCategoriaId));
            }

            if (estados != null && !estados.isEmpty()) {
                List<String> cleanEstados = estados.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .toList();
                if (!cleanEstados.isEmpty()) {
                    predicates.add(root.get("estado").get("codigo").in(cleanEstados));
                }
            }

            if (prioridadId != null) {
                predicates.add(cb.equal(root.get("prioridad").get("id"), prioridadId));
            }

            if (categoriaId != null) {
                predicates.add(cb.equal(root.get("categoria").get("id"), categoriaId));
            }

            if (filtroTecnicoId != null) {
                predicates.add(cb.equal(root.get("tecnicoAsignado").get("id"), filtroTecnicoId));
            }

            if (StringUtils.hasText(textoBusqueda)) {
                String pattern = "%" + textoBusqueda.trim().toLowerCase() + "%";
                Predicate porCodigo = cb.like(cb.lower(root.get("codigo")), pattern);
                Predicate porTitulo = cb.like(cb.lower(root.get("titulo")), pattern);
                predicates.add(cb.or(porCodigo, porTitulo));
            }

            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaRegistro"), fechaDesde));
            }

            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaRegistro"), fechaHasta));
            }

            if (Boolean.TRUE.equals(soloVencidas)) {
                Predicate noFinal = cb.isFalse(root.get("estado").get("esFinal"));
                Predicate tieneSla = cb.isNotNull(root.get("fechaLimiteSla"));
                Predicate vencida = cb.lessThan(root.get("fechaLimiteSla"), ahora != null ? ahora : LocalDateTime.now());
                predicates.add(cb.and(noFinal, tieneSla, vencida));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
