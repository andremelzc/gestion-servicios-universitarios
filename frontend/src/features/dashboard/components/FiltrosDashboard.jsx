import { useId, useRef, useState } from 'react';
import './FiltrosDashboard.css';

const RANGO_INVALIDO = 'La fecha inicial no puede ser posterior a la fecha final.';
const PISTA =
  'Sin fechas se muestran los últimos 30 días. Si indicas solo Hasta, se muestran los 30 días que terminan ese día. Si indicas solo Desde, se muestra hasta hoy.';

// Fecha local `yyyy-mm-dd` (toISOString daría la UTC y podría adelantarse un día de noche).
function hoyLocal() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Filtros de fecha del dashboard (presentacional). Se aplican con el botón para no disparar
 * cinco peticiones por cada tecla. Las fechas ISO `yyyy-mm-dd` se comparan como texto.
 * `onAplicar({ desde, hasta })` con cadenas vacías cuando falta una fecha; así las resuelve el
 * backend (DashboardService): sin ninguna, los últimos 30 días; solo `hasta`, los 30 días que
 * terminan ese día (`desde = hasta - 29`); solo `desde`, hasta hoy.
 *
 * Filtro Área (RN-16): solo aparece si el padre pasa `areas` no vacío (`{ id, nombre }`), cosa que
 * hace únicamente para ADMIN y con la lista ya cargada (sin control muerto). `errorAreas` es el aviso si no pudo cargarse.
 */
export default function FiltrosDashboard({ onAplicar, areas, errorAreas }) {
  const id = useId();
  const desdeRef = useRef(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [idArea, setIdArea] = useState('');
  const [error, setError] = useState(null);
  const pistaId = `${id}-pista`;
  const errorId = `${id}-error`;
  const errorAreasId = `${id}-error-areas`;
  const descripcion = error ? `${pistaId} ${errorId}` : pistaId;
  const hoy = hoyLocal();

  function enviar(evento) {
    evento.preventDefault();
    if (desde && hasta && desde > hasta) {
      setError(RANGO_INVALIDO);
      desdeRef.current?.focus();
      return;
    }
    setError(null);
    // `idArea` solo viaja si el selector existe (ADMIN, RN-16); el resto de roles nunca lo envía.
    onAplicar(
      areas?.length > 0
        ? { desde, hasta, idArea: idArea === '' ? '' : Number(idArea) }
        : { desde, hasta },
    );
  }

  return (
    <form
      className="filtros-dashboard"
      role="search"
      aria-label="Filtros del dashboard"
      onSubmit={enviar}
      noValidate
    >
      <div className="filtros-dashboard__campo">
        <label htmlFor={`${id}-desde`}>Desde</label>
        <input
          ref={desdeRef}
          id={`${id}-desde`}
          type="date"
          value={desde}
          max={hoy}
          onChange={(e) => setDesde(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={descripcion}
        />
      </div>
      <div className="filtros-dashboard__campo">
        <label htmlFor={`${id}-hasta`}>Hasta</label>
        <input
          id={`${id}-hasta`}
          type="date"
          value={hasta}
          max={hoy}
          onChange={(e) => setHasta(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={descripcion}
        />
      </div>
      {areas?.length > 0 ? (
        <div className="filtros-dashboard__campo">
          <label htmlFor={`${id}-area`}>Área</label>
          <select id={`${id}-area`} value={idArea} onChange={(e) => setIdArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <button type="submit" className="filtros-dashboard__boton">
        Aplicar
      </button>
      <p id={pistaId} className="filtros-dashboard__pista">
        {PISTA}
      </p>
      {errorAreas ? (
        <p id={errorAreasId} role="alert" className="filtros-dashboard__error">
          {errorAreas}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="filtros-dashboard__error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
