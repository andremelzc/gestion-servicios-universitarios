import { useId } from 'react';
import { interpretarError } from '../../../services/errores.js';
import './WidgetEstado.css';

/**
 * Marco de estado de un widget del dashboard (presentacional): cargando, error con reintento o,
 * en `ok`, el contenido tal cual (los gráficos traen su propio título y estado vacío). El título
 * se muestra siempre (cargando, error y ok) para no cambiar la estructura de encabezados.
 * `compacto`: altura mínima menor (KPIs); el resto reserva la de un gráfico para que el diseño
 * no colapse y salte al recargar con otros filtros.
 * `error` es el normalizado por apiClient; el texto sale de `interpretarError` (UX §9).
 */
export default function WidgetEstado({
  titulo,
  estado,
  error,
  onReintentar,
  nivelTitulo = 2,
  compacto = false,
  children,
}) {
  const tituloId = useId();
  if (estado === 'ok') return children;

  const Titulo =
    Number.isInteger(nivelTitulo) && nivelTitulo >= 1 && nivelTitulo <= 6
      ? `h${nivelTitulo}`
      : 'h2';
  const cargando = estado === 'cargando';
  // Con 403 repetir la petición no cambia el permiso: no se ofrece reintento.
  const reintentable = error?.status !== 403;
  const mensaje = interpretarError(error).general ?? 'Ocurrió un error inesperado.';

  return (
    <section
      className={compacto ? 'widget-estado widget-estado--compacto' : 'widget-estado'}
      aria-labelledby={tituloId}
      aria-busy={cargando ? 'true' : undefined}
    >
      <Titulo id={tituloId} className="widget-estado__titulo">
        {titulo}
      </Titulo>
      {cargando ? (
        <>
          <p role="status" className="sr-only">
            {`Cargando ${titulo}…`}
          </p>
          <div className="widget-estado__esqueleto" aria-hidden="true" />
        </>
      ) : (
        <div className="widget-estado__error">
          <p role="alert" className="widget-estado__mensaje">
            <span aria-hidden="true">⚠ </span>
            {mensaje}
          </p>
          {reintentable ? (
            <button
              type="button"
              className="widget-estado__boton"
              aria-label={`Reintentar: ${titulo}`}
              onClick={onReintentar}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
