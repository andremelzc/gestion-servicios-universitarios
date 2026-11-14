import { IconoFicha } from './Icon.jsx';
import './ui.css';

/**
 * Encabezado de página: `h1`, descripción opcional y acciones a la derecha.
 * `tituloProps` se aplica al `h1` (id, ref, tabIndex…) para pantallas que enfocan su título.
 */
export default function PageHeader({
  titulo,
  descripcion,
  icono,
  tono = 'primario',
  acciones,
  tituloProps = {},
  className = '',
}) {
  return (
    <header className={`ui-pagina-cabecera ${className}`.trim()}>
      <div className="ui-pagina-cabecera__texto">
        {icono && <IconoFicha nombre={icono} tono={tono} tamano={24} />}
        <div>
          <h1 className="ui-pagina-cabecera__titulo" {...tituloProps}>
            {titulo}
          </h1>
          {descripcion && <p className="ui-pagina-cabecera__descripcion">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="ui-pagina-cabecera__acciones">{acciones}</div>}
    </header>
  );
}
