import { IconoFicha } from './Icon.jsx';
import './ui.css';

/**
 * Estado vacío del sistema de diseño (UX §2.4 "EmptyState"): sin datos, sin resultados o sin permisos.
 * Explica qué pasó y, si procede, qué hacer (`acciones`).
 *
 * - `tituloComo`: elemento del título (`h1` en páginas completas como 403/404; `p` por defecto).
 * - `compacto`: versión en línea para el interior de una tarjeta.
 * - `grande`: versión de página completa, centrada.
 */
export default function EmptyState({
  icono = 'inbox',
  tono = 'neutro',
  titulo,
  descripcion,
  acciones,
  tituloComo: Titulo = 'p',
  tituloProps = {},
  compacto = false,
  grande = false,
  className = '',
  ...resto
}) {
  const variante = compacto ? ' ui-vacio--compacto' : grande ? ' ui-vacio--grande' : '';
  return (
    <div className={`ui-vacio${variante} ${className}`.trim()} {...resto}>
      <IconoFicha nombre={icono} tono={tono} tamano={compacto ? 18 : grande ? 32 : 24} />
      <div className="ui-vacio__texto">
        <Titulo className="ui-vacio__titulo" {...tituloProps}>
          {titulo}
        </Titulo>
        {descripcion && <p className="ui-vacio__descripcion">{descripcion}</p>}
      </div>
      {acciones && <div className="ui-vacio__acciones">{acciones}</div>}
    </div>
  );
}
