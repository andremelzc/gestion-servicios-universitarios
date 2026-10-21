import './PrioridadTag.css';
import { etiquetaPrioridad, normalizar } from './catalogos.js';

// Un icono distinto por nivel (UX §8): la prioridad no depende solo del color.
// Baja: triángulo hacia abajo; media: barra; alta: triángulo hacia arriba;
// crítica: triángulo de advertencia con exclamación; desconocida: círculo vacío.
const ICONOS = {
  baja: <path d="M2 4h12L8 13z" />,
  media: <rect x="2" y="6" width="12" height="4" rx="1" />,
  alta: <path d="M2 12h12L8 3z" />,
  critica: <path fillRule="evenodd" d="M8 1 15 14H1zM7.25 6h1.5v4h-1.5zM7.25 11h1.5v1.5h-1.5z" />,
  desconocido: <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />,
};

const NIVELES = { BAJA: 'baja', MEDIA: 'media', ALTA: 'alta', CRITICA: 'critica' };

/**
 * Etiqueta de prioridad (UX §2.3 y §8): icono distinto por nivel + texto.
 * El icono es decorativo (`aria-hidden`): el nombre accesible es el texto.
 *
 * Los DTO planos del backend la envían como `prioridadNivel`.
 *
 * @param {string} props.prioridad Código de la API (`'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'`).
 * @param {boolean} [props.mostrarPrefijo=true] Prefijo "Prioridad: " solo para lectores de
 *   pantalla; desactivarlo si la celda ya tiene un encabezado de columna.
 */
export default function PrioridadTag({ prioridad, mostrarPrefijo = true }) {
  if (!prioridad) return null;
  const nivel = NIVELES[normalizar(prioridad)] ?? 'desconocido';
  return (
    <span className="prioridad-tag" data-nivel={nivel}>
      <svg
        className="prioridad-tag__icono"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {ICONOS[nivel]}
      </svg>
      {mostrarPrefijo && <span className="sr-only">Prioridad: </span>}
      {etiquetaPrioridad(prioridad)}
    </span>
  );
}
