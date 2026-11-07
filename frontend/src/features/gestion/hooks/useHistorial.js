import { useCallback, useEffect, useState } from 'react';
import { obtenerHistorial } from '../../../services/solicitudes.api.js';

/**
 * Consulta el historial de una solicitud (`GET /solicitudes/{id}/historial`) y lo vuelve a pedir
 * cuando cambia el `id` o al llamar `refetch()`. Cancela con `AbortController` la petición que
 * queda obsoleta.
 *
 * Devuelve `{ data, isLoading, error, refetch }`. `isLoading` se deriva de la consulta vigente
 * (sin `setState` síncrono en el efecto); `error` es el normalizado por `apiClient`.
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
        setResultado({ clave, data: Array.isArray(data) ? data : [], error: null });
      })
      .catch((error) => {
        if (control.signal.aborted) return;
        setResultado({ clave, data: [], error });
      });
    return () => control.abort();
  }, [id, clave]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = resultado?.clave === clave ? resultado : null;

  return {
    data: vigente?.data ?? [],
    error: vigente?.error ?? null,
    isLoading: vigente === null,
    refetch,
  };
}
