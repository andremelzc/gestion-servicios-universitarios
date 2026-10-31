package edu.universidad.servicios.common.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaginacionValidatorTest {

    private static final Set<String> WHITELIST = Set.of("fechaRegistro", "codigo", "titulo");

    @Test
    @DisplayName("validar permite pageable nulo sin lanzar excepción")
    void permitePageableNulo() {
        assertThatCode(() -> PaginacionValidator.validar(null, WHITELIST))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validar permite paginación válida con sort en lista blanca")
    void permitePaginacionValida() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "fechaRegistro"));
        assertThatCode(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validar permite límite máximo de tamaño (100 elementos)")
    void permiteLimiteMaximo() {
        Pageable pageable = PageRequest.of(2, 100, Sort.unsorted());
        assertThatCode(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validar rechaza tamaño superior a 100 con IllegalArgumentException")
    void rechazaTamanoExcedido() {
        Pageable pageable = PageRequest.of(0, 101, Sort.unsorted());
        assertThatThrownBy(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("excede el límite máximo permitido de 100");
    }

    @Test
    @DisplayName("validar rechaza tamaño menor a 1 con IllegalArgumentException")
    void rechazaTamanoMenorAUno() {
        // PageRequest.of normally checks size > 0, but custom Pageable could have size <= 0
        Pageable pageable = new Pageable() {
            @Override public int getPageNumber() { return 0; }
            @Override public int getPageSize() { return 0; }
            @Override public long getOffset() { return 0; }
            @Override public Sort getSort() { return Sort.unsorted(); }
            @Override public Pageable next() { return this; }
            @Override public Pageable previousOrFirst() { return this; }
            @Override public Pageable first() { return this; }
            @Override public Pageable withPage(int pageNumber) { return this; }
            @Override public boolean hasPrevious() { return false; }
        };

        assertThatThrownBy(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("debe ser mayor o igual a 1");
    }

    @Test
    @DisplayName("validar rechaza número de página negativo")
    void rechazaPaginaNegativa() {
        Pageable pageable = new Pageable() {
            @Override public int getPageNumber() { return -1; }
            @Override public int getPageSize() { return 20; }
            @Override public long getOffset() { return 0; }
            @Override public Sort getSort() { return Sort.unsorted(); }
            @Override public Pageable next() { return this; }
            @Override public Pageable previousOrFirst() { return this; }
            @Override public Pageable first() { return this; }
            @Override public Pageable withPage(int pageNumber) { return this; }
            @Override public boolean hasPrevious() { return false; }
        };

        assertThatThrownBy(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no puede ser negativo");
    }

    @Test
    @DisplayName("validar rechaza campo de ordenamiento fuera de lista blanca (CA-6)")
    void rechazaCampoOrdenamientoFueraDeListaBlanca() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("passwordHash"));
        assertThatThrownBy(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Parámetro de ordenamiento 'sort' inválido")
                .hasMessageContaining("passwordHash");
    }

    @Test
    @DisplayName("validar rechaza inyección o comodín en campo de ordenamiento")
    void rechazaInyeccionEnSort() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("' OR 1=1 --"));
        assertThatThrownBy(() -> PaginacionValidator.validar(pageable, WHITELIST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("' OR 1=1 --");
    }
}

