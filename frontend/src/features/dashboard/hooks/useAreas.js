import { useEffect, useState } from 'react';
import { areasApi } from '../../../services/areas.api.js';

const SIN_AREAS = { areas: [], error: false };

/**
 * Áreas para el filtro del dashboard. Con `habilitado` en `false` (cualquier rol salvo ADMIN)
 * no se hace ninguna petición. El resultado se escribe solo en los callbacks de la promesa
 * (regla `react-hooks/set-state-in-effect`); si falla, el dashboard sigue sin áreas que elegir.
 */
export function useAreas(habilitado) {
  const [resultado, setResultado] = useState(SIN_AREAS);

  useEffect(() => {
    if (!habilitado) return undefined;
    const controlador = new AbortController();
    areasApi.listar({ signal: controlador.signal }).then(
      (areas) => {
        if (!controlador.signal.aborted) {
          setResultado({ areas: Array.isArray(areas) ? areas : [], error: false });
        }
      },
      () => {
        if (!controlador.signal.aborted) setResultado({ areas: [], error: true });
      },
    );
    return () => controlador.abort();
  }, [habilitado]);

  return resultado;
}
