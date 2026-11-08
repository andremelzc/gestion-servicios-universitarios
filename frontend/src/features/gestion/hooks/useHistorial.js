import { useCallback, useEffect, useState } from 'react';
import { obtenerHistorial } from '../../../services/solicitudes.api.js';

/**
 * Consulta el historial de una solicitud (`GET /solicitudes/{id}/historial`) y lo vuelve a pedir
 * cuando cambia el `id` o al llamar `refetch()`. Cancela con `AbortController` la petición que
 * queda obsoleta.
 *
 * Devuelve `{ data, isLoading, isRefreshing, error, refetch }`. `isLoading` solo es verdadero
 * mientras no hay respuesta para esta solicitud (sin `setState` síncrono en el efecto);
 * `isRefreshing`, mientras se repite la consulta de la misma solicitud y se conservan los datos
 * previos. `error` es el normalizado por `apiClient`.
 */
export default function useHistorial(id) {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const clave = `${id}#${version}`;

  useEffect(() => {
    const control = new AbortController();
    obtenerHistorial(id, { signal: control.signal })
      .then((data) => {
        if (control.signal.aborted) return;
        setResultado({ id, clave, data: Array.isArray(data) ? data : [], error: null });
      })
      .catch((error) => {
        if (control.signal.aborted) return;
        setResultado({ id, clave, data: [], error });
      });
    return () => control.abort();
  }, [id, clave]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = resultado?.clave === clave ? resultado : null;
  // Con la misma solicitud (refetch) se siguen mostrando los datos previos; solo otra solicitud
  // pasa por el esqueleto.
  const mismaSolicitud = resultado?.id === id;

  return {
    data: mismaSolicitud ? resultado.data : [],
    error: mismaSolicitud ? resultado.error : null,
    isLoading: !mismaSolicitud,
    isRefreshing: mismaSolicitud && vigente === null,
    refetch,
  };
}
