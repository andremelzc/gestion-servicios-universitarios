import { useEffect, useState } from 'react';
import { dashboardApi } from '../../../services/dashboard.api.js';
import VencidasTable from './VencidasTable.jsx';
import WidgetEstado from './WidgetEstado.jsx';

export default function VencidasWidget({ filtros }) {
  const [page, setPage] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    dashboardApi.vencidas({ ...filtros, page }, { signal: controller.signal }).then(
      (datos) => {
        if (!controller.signal.aborted) setResultado({ page, intento, datos });
      },
      (error) => {
        if (!controller.signal.aborted) setResultado({ page, intento, error });
      },
    );
    return () => controller.abort();
  }, [filtros, page, intento]);
  const vigente = resultado?.page === page && resultado?.intento === intento;
  if (!resultado || (vigente && resultado.error) || (!vigente && !resultado.datos)) {
    // Mismo patrón de carga y error que el resto de widgets (AUD-10).
    return (
      <WidgetEstado
        titulo="Solicitudes vencidas"
        estado={vigente && resultado?.error ? 'error' : 'cargando'}
        error={resultado?.error}
        onReintentar={() => setIntento((n) => n + 1)}
      />
    );
  }
  return (
    <section aria-labelledby="vencidas-titulo">
      <h2 id="vencidas-titulo">Solicitudes vencidas</h2>
      {!resultado && !vigente ? (
        <p role="status">Cargando solicitudes vencidas…</p>
      ) : vigente && resultado.error ? (
        <div role="alert">
          No se pudieron cargar las solicitudes vencidas.{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : resultado.datos ? (
        <VencidasTable datos={resultado.datos} onPageChange={setPage} isLoading={!vigente} />
      ) : (
        <p role="status">Cargando solicitudes vencidas…</p>
      )}
    </section>
  );
}
