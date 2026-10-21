import './EstadoBadge.css';
import { etiquetaEstado, hexValido } from './catalogos.js';

// Token de color por código (UX §2.1); se usa si el catálogo no trae un `colorHex` válido.
const TOKEN_POR_CODIGO = {
  REGISTRADA: 'var(--color-estado-registrada)',
  EN_EVALUACION: 'var(--color-estado-evaluacion)',
  ASIGNADA: 'var(--color-estado-asignada)',
  EN_ATENCION: 'var(--color-estado-atencion)',
  RESUELTA: 'var(--color-estado-resuelta)',
  CERRADA: 'var(--color-estado-cerrada)',
};

/**
 * Insignia de estado de una solicitud (UX §2.3 y §8): texto + punto de color.
 * El texto va en `--color-text` sobre un fondo tintado al 12 %, porque el color del
 * estado solo no alcanza contraste AA como texto. El punto es decorativo (`aria-hidden`)
 * y lleva un anillo oscuro para cumplir 3:1 contra el tinte con cualquier `colorHex`.
 *
 * Discrepancia doc vs. backend: api-rest §3.2 devuelve `estado` como objeto
 * `{codigo, nombreVisible, colorHex}`, pero §2.2 lo manda como cadena y los DTO reales
 * (`SolicitudResumenResponse`, `SolicitudDetalleResponse`) son planos: `estadoCodigo`,
 * `estadoNombre`, `estadoColorHex`. Por eso se aceptan las tres formas:
 *   <EstadoBadge estado={{ codigo, nombreVisible, colorHex }} />
 *   <EstadoBadge estado="ASIGNADA" />
 *   <EstadoBadge estado={s.estadoCodigo} nombre={s.estadoNombre} colorHex={s.estadoColorHex} />
 *
 * @param {string | { codigo: string, nombreVisible?: string, colorHex?: string }} props.estado
 * @param {string} [props.nombre] Nombre visible (prevalece sobre el del objeto).
 * @param {string} [props.colorHex] `#RRGGBB` (prevalece sobre el del objeto).
 * @param {boolean} [props.mostrarPrefijo=true] Prefijo "Estado: " solo para lectores de
 *   pantalla; desactivarlo si la celda ya tiene un encabezado de columna.
 */
export default function EstadoBadge({ estado, nombre, colorHex, mostrarPrefijo = true }) {
  if (!estado) return null;
  const datos = typeof estado === 'string' ? { codigo: estado } : estado;
  const color =
    hexValido(colorHex) ??
    hexValido(datos.colorHex) ??
    TOKEN_POR_CODIGO[datos.codigo] ??
    'var(--color-text-muted)';
  return (
    <span className="estado-badge" style={{ '--estado-color': color }}>
      <span className="estado-badge__punto" aria-hidden="true" />
      {mostrarPrefijo && <span className="sr-only">Estado: </span>}
      {nombre || datos.nombreVisible || etiquetaEstado(datos.codigo)}
    </span>
  );
}
