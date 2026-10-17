import { estadoSla } from '../sla.js';
import './SlaIndicador.css';

// Un icono distinto por nivel: el SLA nunca depende solo del color (UX §8).
const ICONOS = {
  aTiempo: <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />,
  atendida: <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />,
  porVencer: (
    <path
      d="M8 1 15 14H1zM7.25 6h1.5v4h-1.5zM7.25 11h1.5v1.5h-1.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  ),
  vencida: <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2" />,
  sinSla: <path d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="2" />,
};

/**
 * Indicador de SLA: icono + texto ("Vence en 2 h", "Vencida"). `ahora` (ms) lo aporta el
 * contenedor para no leer el reloj durante el render.
 */
export default function SlaIndicador({ ahora, mostrarPrefijo = true, ...solicitud }) {
  const { nivel, texto } = estadoSla({ ...solicitud, ahora });
  return (
    <span className="sla-indicador" data-sla={nivel}>
      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" focusable="false">
        {ICONOS[nivel]}
      </svg>
      {mostrarPrefijo && <span className="sr-only">SLA:</span>}
      <span>{texto}</span>
    </span>
  );
}
