import Icon from './Icon.jsx';
import './ui.css';

/**
 * Botón (o enlace con aspecto de botón) del sistema de diseño (UX §2.4).
 *
 * - `variante`: `primario`, `secundario`, `peligro` o `enlace`.
 * - `icono`: nombre de `Icon`, a la izquierda del texto.
 * - `cargando`: muestra un spinner y bloquea el botón (evita el doble envío); `aria-busy` lo anuncia.
 * - `como`: elemento o componente a renderizar; con `Link` se obtiene un enlace con estilo de botón.
 *   Si es un `button`, `type` es `button` salvo que se indique otro (así no envía formularios sin querer).
 */
export default function Button({
  variante = 'primario',
  icono,
  cargando = false,
  como: Componente = 'button',
  className = '',
  children,
  ...resto
}) {
  const props = Componente === 'button' ? { type: 'button', ...resto } : { ...resto };
  if (Componente === 'button' && cargando) {
    props.disabled = true;
    props['aria-busy'] = true;
  }
  return (
    <Componente className={`ui-btn ui-btn--${variante} ${className}`.trim()} {...props}>
      {cargando ? (
        <span className="ui-spinner" aria-hidden="true" />
      ) : (
        icono && <Icon nombre={icono} tamano={18} />
      )}
      {children}
    </Componente>
  );
}
