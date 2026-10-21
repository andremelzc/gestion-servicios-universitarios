import { useEffect, useState } from 'react';

/**
 * Carga independiente de un widget del dashboard: cada gráfico/KPI tiene su propio estado
 * (`cargando` | `ok` | `error`) y su propio reintento, de modo que uno que falle no tumba al resto.
 *
 * - `cargar(filtros, { signal })`: función estable (p. ej. `dashboardApi.kpis`) que devuelve una promesa.
 * - `filtros`: `{ desde, hasta, idArea }`; se comparan por valor, no por referencia.
 *
 * El estado se escribe solo en los callbacks de la promesa (nunca síncrono dentro del efecto,
 * regla `react-hooks/set-state-in-effect`): el resultado guarda la clave de la petición que lo
 * originó y "cargando" se deriva de que esa clave no coincida con la actual.
 */
export function useDashboardWidget(cargar, { desde, hasta, idArea } = {}) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState(null);
  const clave = JSON.stringify([desde ?? null, hasta ?? null, idArea ?? null, intento]);

  useEffect(() => {
    const controlador = new AbortController();
    cargar({ desde, hasta, idArea }, { signal: controlador.signal }).then(
      (datos) => {
        if (!controlador.signal.aborted) setResultado({ clave, datos, error: null });
      },
      (error) => {
        // Un rechazo por cancelación es una petición obsoleta, no un fallo para el usuario.
        if (!controlador.signal.aborted) setResultado({ clave, datos: null, error });
      },
    );
    return () => controlador.abort();
  }, [cargar, clave, desde, hasta, idArea]);

  const vigente = resultado?.clave === clave;
  return {
    estado: !vigente ? 'cargando' : resultado.error ? 'error' : 'ok',
    datos: vigente ? resultado.datos : null,
    error: vigente ? resultado.error : null,
    reintentar: () => setIntento((n) => n + 1),
  };
}
