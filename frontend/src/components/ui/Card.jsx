import { useId } from 'react';
import { IconoFicha } from './Icon.jsx';
import './ui.css';

/**
 * Tarjeta del sistema de diseño: superficie elevada con encabezado opcional.
 *
 * - `titulo`: texto del `h2` de la tarjeta (la tarjeta se etiqueta con él).
 * - `icono` y `tono`: ficha de color a la izquierda del título.
 * - `acciones`: nodos alineados a la derecha del encabezado.
 * - `sinPadding`: para contenido que ocupa todo el ancho (p. ej. tablas).
 */
export default function Card({
  como: Componente = 'section',
  titulo,
  icono,
  tono = 'primario',
  acciones,
  sinPadding = false,
  className = '',
  children,
  ...resto
}) {
  const tituloId = useId();
  const etiquetada = titulo ? { 'aria-labelledby': tituloId } : {};
  return (
    <Componente
      className={`ui-tarjeta${sinPadding ? ' ui-tarjeta--plana' : ''} ${className}`.trim()}
      {...etiquetada}
      {...resto}
    >
      {(titulo || acciones) && (
        <div className="ui-tarjeta__cabecera">
          {titulo && (
            <h2 id={tituloId} className="ui-tarjeta__titulo">
              {icono && <IconoFicha nombre={icono} tono={tono} />}
              {titulo}
            </h2>
          )}
          {acciones && <div className="ui-tarjeta__acciones">{acciones}</div>}
        </div>
      )}
      {children}
    </Componente>
  );
}
