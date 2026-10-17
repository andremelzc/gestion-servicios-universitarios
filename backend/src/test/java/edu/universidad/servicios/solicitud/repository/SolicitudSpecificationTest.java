package edu.universidad.servicios.solicitud.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import edu.universidad.servicios.solicitud.domain.Solicitud;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

class SolicitudSpecificationTest {

	@Test
	void creaPredicadoConTodosLosFiltrosYNormalizaTexto() {
		Root<Solicitud> root = mock(Root.class);
		CriteriaBuilder cb = mock(CriteriaBuilder.class);
		Predicate predicate = mock(Predicate.class);
		Path<Object> relation = mock(Path.class);
		Path<Object> field = mock(Path.class);
		when(root.get(anyString())).thenReturn(relation);
		when(relation.get(anyString())).thenReturn(field);
		when(cb.equal(any(), any())).thenReturn(predicate);
		when(cb.like(any(), anyString())).thenReturn(predicate);
		when(cb.lower(any())).thenReturn(
			mock(jakarta.persistence.criteria.Expression.class)
		);
		when(cb.or(any(Predicate[].class))).thenReturn(predicate);
		when(
			cb.greaterThanOrEqualTo(any(), any(LocalDateTime.class))
		).thenReturn(predicate);
		when(cb.lessThanOrEqualTo(any(), any(LocalDateTime.class))).thenReturn(
			predicate
		);
		when(cb.and(any(Predicate[].class))).thenReturn(predicate);

		Specification<Solicitud> specification =
			SolicitudSpecification.conFiltros(
				7L,
				" RESUELTA ",
				3,
				2,
				"  Fuga  ",
				LocalDateTime.of(2025, 1, 1, 0, 0),
				LocalDateTime.of(2025, 12, 31, 23, 59)
			);

		assertThat(specification.toPredicate(root, null, cb)).isSameAs(
			predicate
		);
	}

	@Test
	void permiteFiltrosVaciosSinAgregarCondiciones() {
		Root<Solicitud> root = mock(Root.class);
		CriteriaBuilder cb = mock(CriteriaBuilder.class);
		Predicate predicate = mock(Predicate.class);
		when(cb.and(any(Predicate[].class))).thenReturn(predicate);

		assertThat(
			SolicitudSpecification.conFiltros(
				null,
				"  ",
				null,
				null,
				"",
				null,
				null
			).toPredicate(root, null, cb)
		).isSameAs(predicate);
	}
}
