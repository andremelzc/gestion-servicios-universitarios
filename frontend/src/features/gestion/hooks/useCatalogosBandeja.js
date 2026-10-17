import { useEffect, useState } from 'react';
import {
  listarCategorias,
  listarPrioridades,
  listarTecnicos,
} from '../../../services/solicitudes.api.js';

const VACIOS = { prioridades: [], categorias: [], tecnicos: [] };

/**
 * Catálogos de los filtros y del modal de asignación. Si una lista falla queda vacía: el filtro
 * correspondiente se oculta, pero la bandeja sigue siendo usable.
 */
export default function useCatalogosBandeja() {
  const [catalogos, setCatalogos] = useState(VACIOS);

  useEffect(() => {
    const control = new AbortController();
    const opciones = { signal: control.signal };
    const opcional = (promesa) => promesa.catch(() => []);
    Promise.all([
      opcional(listarPrioridades(opciones)),
      opcional(listarCategorias(opciones)),
      opcional(listarTecnicos(opciones)),
    ]).then(([prioridades, categorias, tecnicos]) => {
      if (!control.signal.aborted) setCatalogos({ prioridades, categorias, tecnicos });
    });
    return () => control.abort();
  }, []);

  return catalogos;
}
