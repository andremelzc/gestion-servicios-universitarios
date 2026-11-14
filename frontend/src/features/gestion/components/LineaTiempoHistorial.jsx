import { useId } from 'react';
import EstadoBadge from '../../../components/ui/EstadoBadge.jsx';
import { etiquetaEstado } from '../../../components/ui/catalogos.js';
import { interpretarError } from '../../../services/errores.js';
import useHistorial from '../hooks/useHistorial.js';
import './LineaTiempoHistorial.css';

// api-rest §1: los instantes viajan en UTC y se muestran en America/Lima. Si llegan sin sufijo
// de zona (`LocalDateTime` del backend, que trabaja en UTC) se completa la `Z` al interpretarlos.
const FORMATO_FECHA = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima',
});

const aInstanteUtc = (iso) => (/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`);

function formatearFecha(iso) {
  const fecha = new Date(aInstanteUtc(iso));
  return Number.isNaN(fecha.getTime()) ? 'Sin fecha' : FORMATO_FECHA.format(fecha);
}

/** Más antiguo primero. `sort` es estable: con el mismo instante se respeta el orden del API. */
function ordenarCronologicamente(eventos) {
  const instante = (evento) => Date.parse(aInstanteUtc(evento.fecha)) || 0;
  return [...eventos].sort((a, b) => instante(a) - instante(b));
}

/**
 * Línea de tiempo del historial de una solicitud (UX §2.4 `Timeline`, GES-21): estado, actor y
 * hora local de cada transición, más la nota si la hay. Pide `GET /solicitudes/{id}/historial`
 * con `useHistorial` y resuelve los cuatro estados de UX §2.5: carga, error con reintento, vacío y
 * lista. Es una región con nombre; los eventos van en un `<ol>` porque el orden importa.
 *
 * Para refrescarla tras una acción (evaluar, asignar, cerrar…) basta con cambiar su `key`.
 *
 * @param {number|string} props.idSolicitud Identificador de la solicitud.
 * @param {string} [props.titulo='Historial'] Texto del encabezado (nombre accesible de la región).
 * @param {number} [props.nivelTitulo=2] Nivel del encabezado (1 a 6), según el contexto de la página.
 */
export default function LineaTiempoHistorial({
  idSolicitud,
  titulo = 'Historial',
  nivelTitulo = 2,
}) {
  const tituloId = useId();
  const { data, isLoading, isRefreshing, error, refetch } = useHistorial(idSolicitud);
  // Tras un error, "Reintentar" vuelve al esqueleto; un refresco sin error conserva la lista.
  const cargando = isLoading || (isRefreshing && Boolean(error));

  const Titulo =
    Number.isInteger(nivelTitulo) && nivelTitulo >= 1 && nivelTitulo <= 6
      ? `h${nivelTitulo}`
      : 'h2';
  // El endpoint responde 404 si la solicitud no existe o está fuera de alcance: repetir no cambia
  // el resultado, así que no se ofrece reintento.
  const reintentable = error && error.status !== 404;

  return (
    <section
      className="linea-tiempo"
      aria-labelledby={tituloId}
      aria-busy={cargando ? 'true' : undefined}
    >
      <Titulo id={tituloId} className="linea-tiempo__titulo">
        {titulo}
      </Titulo>

      {cargando && (
        <>
          <p role="status" className="sr-only">
            Cargando historial…
          </p>
          <div className="linea-tiempo__esqueleto" aria-hidden="true" />
        </>
      )}

      {!cargando && error && (
        <div className="linea-tiempo__error">
          <p role="alert" className="linea-tiempo__mensaje">
            <span aria-hidden="true">⚠ </span>
            {interpretarError(error).general ?? 'Ocurrió un error inesperado.'}
          </p>
          {reintentable && (
            <button type="button" className="linea-tiempo__boton" onClick={refetch}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {!cargando && !error && data.length === 0 && (
        <p className="linea-tiempo__vacio">Esta solicitud aún no tiene movimientos.</p>
      )}

      {!cargando && !error && data.length > 0 && (
        <ol className="linea-tiempo__lista">
          {ordenarCronologicamente(data).map((evento, indice) => (
            <li key={`${evento.fecha}-${indice}`} className="linea-tiempo__evento">
              <div className="linea-tiempo__estado">
                <EstadoBadge estado={evento.estadoNuevo} />
                {evento.estadoAnterior && (
                  <span className="linea-tiempo__anterior">
                    Desde {etiquetaEstado(evento.estadoAnterior)}
                  </span>
                )}
              </div>
              <p className="linea-tiempo__meta">
                <span className="linea-tiempo__actor">{evento.usuario}</span>
                <span aria-hidden="true"> · </span>
                <time dateTime={aInstanteUtc(evento.fecha)}>{formatearFecha(evento.fecha)}</time>
              </p>
              {evento.nota && <p className="linea-tiempo__nota">{evento.nota}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
