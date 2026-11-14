import MarcaGisu from '../layout/MarcaGisu.jsx';
import './ui.css';

/**
 * Bloque de carga (UX §2.4 "Skeleton"). Reserva el espacio del contenido real para evitar saltos
 * de diseño. Es decorativo (`aria-hidden`): quien lo use debe anunciar el estado con un `role="status"`.
 */
export default function Skeleton({
  ancho = '100%',
  alto = '1rem',
  redondo = false,
  className = '',
}) {
  return (
    <span
      className={`ui-esqueleto${redondo ? ' ui-esqueleto--redondo' : ''} ${className}`.trim()}
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  );
}

/** Varias líneas de texto de carga; la última es más corta, como en un párrafo. */
export function LineasCarga({ cantidad = 3 }) {
  return (
    <div className="ui-esqueleto-lineas" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} ancho={i === cantidad - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

function EncabezadoCarga() {
  return (
    <div className="ui-cargando__encabezado" aria-hidden="true">
      <Skeleton ancho="40px" alto="40px" />
      <div className="ui-cargando__titulo">
        <Skeleton ancho="min(18rem, 70%)" alto="1.75rem" />
        <Skeleton ancho="min(26rem, 90%)" alto="0.875rem" />
      </div>
    </div>
  );
}

function TablaCarga() {
  return (
    <div className="ui-cargando__tarjeta" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="ui-cargando__fila">
          <Skeleton ancho="22%" />
          <Skeleton ancho="38%" />
          <Skeleton ancho="14%" />
          <Skeleton ancho="12%" />
        </div>
      ))}
    </div>
  );
}

function DetalleCarga() {
  return (
    <div className="ui-cargando__dos-columnas" aria-hidden="true">
      <div className="ui-cargando__tarjeta ui-cargando__tarjeta--relleno">
        <Skeleton ancho="9rem" alto="1.25rem" />
        <LineasCarga cantidad={4} />
        <LineasCarga cantidad={3} />
      </div>
      <div className="ui-cargando__tarjeta ui-cargando__tarjeta--relleno">
        <Skeleton ancho="7rem" alto="1.25rem" />
        <LineasCarga cantidad={2} />
      </div>
    </div>
  );
}

/**
 * Carga de una pantalla completa: encabezado y cuerpo en esqueleto con la forma de la página real.
 * El texto `texto` queda solo para lectores de pantalla (`role="status"`).
 * `tipo`: `tabla` (listados) o `detalle` (dos columnas de tarjetas).
 */
export function PaginaCargando({ texto = 'Cargando…', tipo = 'tabla' }) {
  return (
    <main className="ui-cargando" role="status" aria-busy="true">
      <span className="sr-only">{texto}</span>
      <EncabezadoCarga />
      {tipo === 'detalle' ? <DetalleCarga /> : <TablaCarga />}
    </main>
  );
}

/** Carga a pantalla completa, antes de que exista el shell (p. ej. al validar la sesión). */
export function PantallaCarga({ texto = 'Cargando…' }) {
  return (
    <div className="ui-pantalla-carga" role="status" aria-busy="true">
      <MarcaGisu />
      <span className="ui-spinner ui-spinner--grande" aria-hidden="true" />
      <span className="sr-only">{texto}</span>
    </div>
  );
}
