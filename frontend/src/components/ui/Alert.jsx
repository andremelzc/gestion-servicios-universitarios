import Icon from './Icon.jsx';
import './ui.css';

const ICONO = { error: 'alert', aviso: 'alert', exito: 'check', info: 'info' };

/**
 * Aviso en línea. `tipo`: `error` (role="alert"), `aviso`, `exito` e `info` (role="status").
 * Lleva icono y color, y el texto siempre dice qué pasó: el color no es la única señal.
 */
export default function Alert({ tipo = 'error', className = '', children, ...resto }) {
  return (
    <div
      className={`ui-alerta ui-alerta--${tipo} ${className}`.trim()}
      role={tipo === 'error' ? 'alert' : 'status'}
      {...resto}
    >
      <Icon nombre={ICONO[tipo]} tamano={18} />
      <div>{children}</div>
    </div>
  );
}
