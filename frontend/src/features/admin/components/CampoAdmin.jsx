import { cloneElement } from 'react';
import './adminUi.css';

/**
 * Etiqueta, control y mensajes de un campo de los formularios de administración. Inyecta en el
 * control (único hijo) `id`, `aria-invalid` y `aria-describedby` (error primero, luego ayuda).
 */
export default function CampoAdmin({ id, etiqueta, error, ayuda, ayudaEnVivo = false, children }) {
  const descritoPor = [error && `${id}-error`, ayuda && `${id}-ayuda`].filter(Boolean).join(' ');
  return (
    <div className="admin-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': descritoPor || undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="admin-error">
          {error}
        </p>
      )}
      {/* Con `ayudaEnVivo` el nodo está siempre montado (`role="status"`, cortés): un aviso que
          aparece al teclear solo se anuncia si su región ya existía. */}
      {(ayuda || ayudaEnVivo) && (
        <p id={`${id}-ayuda`} className="admin-ayuda" role={ayudaEnVivo ? 'status' : undefined}>
          {ayuda}
        </p>
      )}
    </div>
  );
}
