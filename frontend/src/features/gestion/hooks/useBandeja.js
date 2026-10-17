import { useCallback, useEffect, useState } from 'react';
import { construirConsulta, listarBandeja } from '../../../services/solicitudes.api.js';

const VACIO = { data: [], page: null };

/**
 * Consulta la bandeja (`GET /solicitudes`) con los filtros recibidos y la vuelve a pedir cuando
 * cambian o al llamar `refetch()`. Cancela con `AbortController` la petición que queda obsoleta.
 *
 * Devuelve `{ data, page, isLoading, error, refetch, consultadoEn }`; `page` y `error` ya vienen
 * en el formato de `DataTable`. `isLoading` se deriva de la consulta vigente (sin `setState`
 * síncrono en el efecto) y `consultadoEn` es el instante de la última respuesta, para que el SLA
 * se calcule sin leer el reloj durante el render.
 */
export default function useBandeja(filtros) {
  const consulta = construirConsulta(filtros);
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const clave = `${consulta}#${version}`;

  useEffect(() => {
    const control = new AbortController();
    listarBandeja(consulta, { signal: control.signal })
      .then((respuesta) =>
        setResultado({ clave, ...respuesta, error: null, consultadoEn: Date.now() }),
      )
      .catch((error) => {
        if (control.signal.aborted) return;
        setResultado({ clave, ...VACIO, error, consultadoEn: Date.now() });
      });
    return () => control.abort();
  }, [consulta, clave]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = resultado?.clave === clave ? resultado : null;
  const mostrado = vigente ?? resultado ?? { ...VACIO, error: null, consultadoEn: null };

  return {
    data: mostrado.data,
    page: mostrado.page,
    error: vigente ? vigente.error : null,
    consultadoEn: mostrado.consultadoEn,
    isLoading: vigente === null,
    refetch,
  };
}
