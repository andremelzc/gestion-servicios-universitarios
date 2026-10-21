import { useId, useRef } from 'react';
import './PestanasEstado.css';

/**
 * Pestañas por estado con el patrón WAI-ARIA (tablist, tab, tabpanel): `aria-selected`, tabulación
 * itinerante (solo la activa entra en el orden de Tab) y flechas, Inicio y Fin con vuelta circular.
 * La activación es automática: mover la selección carga esa vista. El contenido (`children`) se
 * dibuja dentro del `tabpanel`, rotulado por la pestaña activa.
 *
 * Props: pestanas `[{id, nombre}]`, activa (id), onChange(id), etiqueta (nombre accesible del
 * tablist).
 */
export default function PestanasEstado({ pestanas, activa, onChange, etiqueta, children }) {
  const base = useId();
  const refs = useRef({});
  const idTab = (id) => `${base}-tab-${id}`;

  function alPulsar(evento, indice) {
    const destino = {
      ArrowRight: (indice + 1) % pestanas.length,
      ArrowLeft: (indice - 1 + pestanas.length) % pestanas.length,
      Home: 0,
      End: pestanas.length - 1,
    }[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    const { id } = pestanas[destino];
    onChange(id);
    refs.current[id]?.focus();
  }

  return (
    <div className="pestanas-estado">
      <div role="tablist" aria-label={etiqueta} className="pestanas-estado__lista">
        {pestanas.map(({ id, nombre }, indice) => (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            id={idTab(id)}
            type="button"
            role="tab"
            aria-selected={activa === id}
            aria-controls={`${base}-panel`}
            tabIndex={activa === id ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(evento) => alPulsar(evento, indice)}
          >
            {nombre}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={idTab(activa)}>
        {children}
      </div>
    </div>
  );
}
