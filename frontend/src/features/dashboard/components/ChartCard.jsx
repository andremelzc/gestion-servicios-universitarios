import { useId, useState } from 'react';
import { formatPorcentaje, formatValor, porcentaje, totalDatos } from '../chartUtils.js';
import './ChartCard.css';

/**
 * Contenedor accesible de un gráfico: título, gráfico como imagen con resumen,
 * leyenda con valores y alternativa en tabla ("Ver datos"). UX §8, CA-13.
 * `items`: [{ nombre, valor, color }]; `children`: el gráfico (SVG) en sí.
 */
export default function ChartCard({
  titulo,
  tipo,
  items,
  etiquetaValor = 'Solicitudes',
  mostrarPorcentaje = false,
  nivelTitulo = 3,
  children,
}) {
  const tituloId = useId();
  const tablaId = useId();
  const [verTabla, setVerTabla] = useState(false);
  const datos = items ?? [];
  const total = totalDatos(datos);
  // Sin datos o todo en 0: estado vacío en lugar de un gráfico en blanco (CA-11).
  const vacio = datos.length === 0 || total === 0;
  const Titulo =
    Number.isInteger(nivelTitulo) && nivelTitulo >= 1 && nivelTitulo <= 6
      ? `h${nivelTitulo}`
      : 'h3';

  const resumen = `${tipo}: ${titulo}. ${datos
    .map((d) => `${d.nombre}: ${formatValor(d.valor)}.`)
    .join(' ')}`;

  return (
    <section className="chart-card" aria-labelledby={tituloId}>
      <Titulo id={tituloId} className="chart-card__titulo">
        {titulo}
      </Titulo>
      {vacio ? (
        <p className="chart-card__vacio">Sin datos para mostrar.</p>
      ) : (
        <>
          <div className="chart-card__grafico" role="img" aria-label={resumen}>
            {children}
          </div>
          <ul className="chart-card__leyenda" aria-label={`Leyenda: ${titulo}`}>
            {datos.map((d, i) => (
              <li key={`${i}-${d.nombre}`} className="chart-card__leyenda-item">
                <svg className="chart-card__muestra" width="12" height="12" aria-hidden="true">
                  <rect width="12" height="12" rx="2" fill={d.color} />
                </svg>
                <span>{d.nombre}</span>
                <span className="chart-card__valor">
                  {formatValor(d.valor)}
                  {mostrarPorcentaje ? ` (${formatPorcentaje(porcentaje(d.valor, total))})` : ''}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="chart-card__boton"
            aria-expanded={verTabla}
            aria-controls={tablaId}
            onClick={() => setVerTabla((visible) => !visible)}
          >
            {verTabla ? 'Ocultar datos' : 'Ver datos'}
          </button>
          <div id={tablaId} className="chart-card__tabla-contenedor">
            {verTabla ? (
              <table className="chart-card__tabla">
                <caption>{titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col" className="chart-card__col-numerica">
                      {etiquetaValor}
                    </th>
                    {mostrarPorcentaje ? (
                      <th scope="col" className="chart-card__col-numerica">
                        Porcentaje
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((d, i) => (
                    <tr key={`${i}-${d.nombre}`}>
                      <th scope="row">{d.nombre}</th>
                      <td className="chart-card__col-numerica">{formatValor(d.valor)}</td>
                      {mostrarPorcentaje ? (
                        <td className="chart-card__col-numerica">
                          {formatPorcentaje(porcentaje(d.valor, total))}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
