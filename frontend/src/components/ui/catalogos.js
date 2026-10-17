// Etiquetas y colores de los catálogos de estado y prioridad, compartidos por
// EstadoBadge, PrioridadTag y los gráficos del dashboard (una sola fuente).

export const COLOR_NEUTRO = '#4B5563';

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

// Nombres visibles de UX §2.1 para los 6 estados fijos (ADR-009).
const ETIQUETAS_ESTADO = {
  REGISTRADA: 'Registrada',
  EN_EVALUACION: 'En evaluación',
  ASIGNADA: 'Asignada',
  EN_ATENCION: 'En atención',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};

const ETIQUETAS_PRIORIDAD = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

/** Mayúsculas y sin tildes: 'Crítica' y 'CRITICA' se tratan igual. */
export function normalizar(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** `#RRGGBB` válido o `null` (el valor se escribe en un atributo SVG o en CSS). */
export function hexValido(colorHex) {
  return typeof colorHex === 'string' && HEX_COLOR.test(colorHex) ? colorHex : null;
}

/** Usa el `colorHex` del catálogo; solo acepta `#RRGGBB`. */
export function colorEstado(colorHex) {
  return hexValido(colorHex) ?? COLOR_NEUTRO;
}

function humanizar(texto) {
  const minusculas = texto.toLowerCase();
  return minusculas.charAt(0).toUpperCase() + minusculas.slice(1);
}

export function etiquetaEstado(codigo) {
  if (ETIQUETAS_ESTADO[codigo]) return ETIQUETAS_ESTADO[codigo];
  return humanizar(String(codigo ?? '').replaceAll('_', ' '));
}

export function etiquetaPrioridad(nombre) {
  const clave = normalizar(nombre);
  if (ETIQUETAS_PRIORIDAD[clave]) return ETIQUETAS_PRIORIDAD[clave];
  return humanizar(String(nombre ?? ''));
}
