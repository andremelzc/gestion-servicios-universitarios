package edu.universidad.servicios.common.validation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Collection;
import java.util.Set;

/**
 * Validador para proteger endpoints paginados contra consumo excesivo de recursos (OWASP API4) e inyecciones o referencias a atributos no permitidos en el ordenamiento (OWASP API3 / CA-6 / OPS-11).
 */
public final class PaginacionValidator {

    public static final int MAX_PAGE_SIZE = 100;
    public static final int MIN_PAGE_SIZE = 1;

    private PaginacionValidator() {
    }

    /**
     * Valida que el tamaño de página no exceda el límite máximo de 100, que la página no sea negativa y que los campos de ordenamiento pertenezcan a la lista blanca.
     *
     * @param pageable          Parámetros de paginación y ordenamiento recibidos.
     * @param listaBlancaCampos Conjunto de propiedades permitidas para ordenar.
     * @throws IllegalArgumentException si el tamaño excede el máximo, es menor a 1, el número de página es negativo o si algún campo de sort no está en la lista blanca.
     */
    public static void validar(Pageable pageable, Collection<String> listaBlancaCampos) {
        if (pageable == null) {
            return;
        }

        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "El tamaño de página (size=" + pageable.getPageSize() + ") excede el límite máximo permitido de " + MAX_PAGE_SIZE + " elementos."
            );
        }

        if (pageable.getPageSize() < MIN_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "El tamaño de página (size=" + pageable.getPageSize() + ") debe ser mayor o igual a " + MIN_PAGE_SIZE + "."
            );
        }

        if (pageable.getPageNumber() < 0) {
            throw new IllegalArgumentException(
                    "El número de página (page=" + pageable.getPageNumber() + ") no puede ser negativo."
            );
        }

        if (pageable.getSort() != null && pageable.getSort().isSorted() && listaBlancaCampos != null) {
            Set<String> whitelist = listaBlancaCampos instanceof Set<String> set ? set : Set.copyOf(listaBlancaCampos);
            for (Sort.Order order : pageable.getSort()) {
                if (!whitelist.contains(order.getProperty())) {
                    throw new IllegalArgumentException(
                            "Parámetro de ordenamiento 'sort' inválido: el campo '" + order.getProperty()
                                    + "' no está permitido. Campos permitidos: " + whitelist
                    );
                }
            }
        }
    }
}

