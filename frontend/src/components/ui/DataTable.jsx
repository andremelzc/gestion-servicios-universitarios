import { useEffect } from 'react';
import './DataTable.css';
import useMediaQuery from './useMediaQuery.js';

/**
 * Tabla reutilizable para las pantallas de administración: tabla a partir de 768 px y tarjetas
 * por debajo (mobile-first). Es solo de presentación: no consulta la API; los datos y los
 * callbacks llegan por props (los aporta `useCrud` o la pantalla).
 *
 * Los nombres de las props coinciden con lo que devuelve `useCrud`, para pasarlos tal cual:
 *
 *   const crud = useCrud('/categorias', { includeInactive, search, page });
 *   <DataTable
 *     caption="Categorías"
 *     columns={columnas}
 *     data={crud.data}
 *     isLoading={crud.isLoading}
 *     error={crud.error}
 *     onRetry={crud.refetch}
 *   />
 *
 * Props
 * - caption (obligatoria): nombre accesible de la tabla (`<caption>`) y de la lista de tarjetas.
 *   Si llega vacía se avisa por consola en desarrollo.
 * - columns: [{ key, header, render?(fila), tipo?: 'activo' }]. `tipo: 'activo'` dibuja
 *   Activa/Inactiva con icono y texto (el color nunca es el único indicador).
 * - data: filas de la página actual. rowKey: campo único de la fila (por defecto 'id').
 * - renderActions(fila): slot de acciones por fila; actionsHeader: su cabecera ('Acciones').
 * - etiquetasActivo: { activo, inactivo }, por defecto Activa/Inactiva (Usuarios puede pasar
 *   Activo/Inactivo).
 * - isLoading: muestra un esqueleto (tiene prioridad sobre el error y los datos).
 * - error: error ya normalizado por `apiClient` (RFC 7807, ADR-012): { status, detail, errores,
 *   traceId }. La tabla NO lee `error.message`. El texto se elige por `status` con el microcopy
 *   de UX §9:
 *     0 o `sinConexion: true` -> "Sin conexión…" (los errores de red no tienen respuesta HTTP;
 *                                 UX §9 no fija cómo se marca, se aceptan ambas formas)
 *     403 / 404 / 429          -> mensaje propio de §9
 *     >= 500                   -> "Ocurrió un error inesperado…" con el `traceId` si existe
 *     401                      -> mensaje genérico (la sesión expirada la gestiona apiClient)
 *     otro con `detail`        -> el `detail` del servidor (solo si §9 no define texto)
 *     cualquier otro           -> mensaje genérico
 *   Con error se muestra el aviso en lugar de los datos, con el botón "Reintentar" (onRetry).
 * - emptyMessage / emptyAction: texto y llamada a la acción del estado vacío (UX §2.5).
 *
 * Fuera de alcance (#99): el ordenamiento por columnas. El issue y CA-14 no lo piden.
 *
 * Al cruzar 768 px cambia de vista y esta se vuelve a montar: el estado interno de lo que haya
 * en las celdas (p. ej. un campo a medio editar) no se conserva. Las celdas deben ser de solo
 * lectura; la edición va en un modal.
 */

const ERROR_INESPERADO = 'Ocurrió un error inesperado.';

const MENSAJES_ESTADO = {
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.',
  429: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

const SIN_CONEXION = 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.';

function textoDeError({ status, detail, traceId, sinConexion } = {}) {
  if (sinConexion || status === 0) return SIN_CONEXION;
  if (MENSAJES_ESTADO[status]) return MENSAJES_ESTADO[status];
  const inesperado = traceId
    ? `${ERROR_INESPERADO} Si persiste, informa este código de soporte: ${traceId}.`
    : ERROR_INESPERADO;
  if (status >= 500 || status === 401) return inesperado;
  return detail || inesperado;
}

function EstadoActivo({ activo, etiquetas }) {
  return (
    <span className={`data-table__estado data-table__estado--${activo ? 'activa' : 'inactiva'}`}>
      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" focusable="false">
        {activo ? (
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        ) : (
          <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2" />
        )}
      </svg>
      <span>{activo ? etiquetas.activo : etiquetas.inactivo}</span>
    </span>
  );
}

function celda(columna, fila, etiquetas) {
  if (columna.render) return columna.render(fila);
  if (columna.tipo === 'activo') {
    return <EstadoActivo activo={Boolean(fila[columna.key])} etiquetas={etiquetas} />;
  }
  return fila[columna.key];
}

function Tabla({ caption, columns, data, rowKey, renderActions, actionsHeader, etiquetas }) {
  return (
    <div className="data-table__scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table__tabla">
        <caption className="data-table__sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.header}
              </th>
            ))}
            {renderActions && <th scope="col">{actionsHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((fila) => (
            <tr key={fila[rowKey]}>
              {columns.map((c) => (
                <td key={c.key}>{celda(c, fila, etiquetas)}</td>
              ))}
              {renderActions && (
                <td>
                  <div className="data-table__acciones">{renderActions(fila)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tarjetas({ caption, columns, data, rowKey, renderActions, etiquetas }) {
  return (
    // `role="list"` explícito: con `list-style: none` Safari/VoiceOver pierde la semántica de lista.
    <ul className="data-table__tarjetas" role="list" aria-label={caption}>
      {data.map((fila) => (
        <li key={fila[rowKey]} className="data-table__tarjeta">
          <dl>
            {columns.map((c) => (
              <div key={c.key} className="data-table__dato">
                <dt>{c.header}</dt>
                <dd>{celda(c, fila, etiquetas)}</dd>
              </div>
            ))}
          </dl>
          {renderActions && <div className="data-table__acciones">{renderActions(fila)}</div>}
        </li>
      ))}
    </ul>
  );
}

const ETIQUETAS_ACTIVO = { activo: 'Activa', inactivo: 'Inactiva' };

export default function DataTable({
  caption,
  columns,
  data,
  rowKey = 'id',
  renderActions,
  actionsHeader = 'Acciones',
  etiquetasActivo = ETIQUETAS_ACTIVO,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No hay registros para mostrar.',
  emptyAction,
}) {
  const esEscritorio = useMediaQuery('(min-width: 768px)');
  const Vista = esEscritorio ? Tabla : Tarjetas;

  useEffect(() => {
    if (!caption && import.meta.env.DEV) {
      console.warn('DataTable: `caption` es obligatorio (nombre accesible de la tabla).');
    }
  }, [caption]);

  let contenido;
  if (isLoading) {
    contenido = (
      <div role="status" aria-label="Cargando…" aria-busy="true" className="data-table__esqueleto">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="data-table__esqueleto-fila" />
        ))}
      </div>
    );
  } else if (error) {
    contenido = (
      <div role="alert" className="data-table__mensaje data-table__mensaje--error">
        <p>{textoDeError(error)}</p>
        {onRetry && (
          <button type="button" className="data-table__boton" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    );
  } else if (data.length === 0) {
    contenido = (
      <div className="data-table__mensaje">
        <p role="status">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  } else {
    contenido = (
      <Vista
        caption={caption}
        columns={columns}
        data={data}
        rowKey={rowKey}
        renderActions={renderActions}
        actionsHeader={actionsHeader}
        etiquetas={etiquetasActivo}
      />
    );
  }

  return <section className="data-table">{contenido}</section>;
}
