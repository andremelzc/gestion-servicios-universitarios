import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import './ui.css';

const ICONO = { exito: 'check', info: 'info', error: 'alert' };
const TONO = { exito: 'exito', info: 'primario', error: 'peligro' };

// Los avisos de éxito se descartan solos; los de error se quedan hasta que se cierran.
const DURACION_MS = { exito: 6000, info: 6000, error: null };

/**
 * Aviso flotante (UX §2.4 "Toast"): confirma el resultado de una acción sin ocupar espacio en la
 * página. Es una región `aria-live` que se renderiza SIEMPRE (vacía al inicio): un lector de
 * pantalla solo anuncia los cambios de una región que ya existía, así que montarla junto con el
 * mensaje no se anuncia. Vacía no ocupa lugar ni se ve.
 *
 * - `mensaje`: texto; vacío o `null` no muestra nada.
 * - `tipo`: `exito` (por defecto), `info` o `error` (`role="alert"`, no se descarta solo).
 * - El aviso se oculta a los 6 s o con su botón de cerrar; un mensaje distinto lo muestra de nuevo.
 */
export default function Toast({ mensaje, tipo = 'exito', className = '' }) {
  // Se guarda qué mensaje se descartó (y no un booleano): al llegar otro mensaje reaparece solo.
  const [descartado, setDescartado] = useState(null);
  const visible = Boolean(mensaje) && descartado !== mensaje;

  useEffect(() => {
    const duracion = DURACION_MS[tipo];
    if (!mensaje || !duracion) return undefined;
    const temporizador = setTimeout(() => setDescartado(mensaje), duracion);
    return () => clearTimeout(temporizador);
  }, [mensaje, tipo]);

  return (
    <div
      className={`ui-toasts ${className}`.trim()}
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
    >
      {visible && (
        <div className={`ui-toast ui-toast--${tipo}`}>
          <span className={`ui-ficha ui-ficha--${TONO[tipo]} ui-toast__icono`} aria-hidden="true">
            <Icon nombre={ICONO[tipo]} tamano={18} />
          </span>
          <span className="ui-toast__mensaje">{mensaje}</span>
          <button
            type="button"
            className="ui-toast__cerrar"
            aria-label="Cerrar aviso"
            onClick={() => setDescartado(mensaje)}
          >
            <Icon nombre="cerrar" tamano={16} />
          </button>
        </div>
      )}
    </div>
  );
}
