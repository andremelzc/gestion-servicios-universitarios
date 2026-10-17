import { useEffect, useState } from 'react';
import { areasApi } from '../../../services/areas.api.js';

const SIN_AREAS = { areas: [], error: false };

// El contrato de `GET /areas` aún no define si devuelve un arreglo o una página `{ content }`
// (api-rest §3.5): se aceptan ambas; cualquier otra forma se trata como error.
function extraerAreas(cuerpo) {
  if (Array.isArray(cuerpo)) return cuerpo;
  if (Array.isArray(cuerpo?.content)) return cuerpo.content;
  return null;
}

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
      (cuerpo) => {
        if (controlador.signal.aborted) return;
        const areas = extraerAreas(cuerpo);
        setResultado(areas ? { areas, error: false } : { areas: [], error: true });
      },
      () => {
        if (!controlador.signal.aborted) setResultado({ areas: [], error: true });
      },
    );
    return () => controlador.abort();
  }, [habilitado]);

  return resultado;
}
