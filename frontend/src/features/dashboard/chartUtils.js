// Utilidades compartidas por los gráficos del dashboard.
// Los colores salen de los tokens de UX §2.1 (estado, éxito, advertencia, peligro),
// nunca de la paleta por defecto de la librería.

export const COLOR_NEUTRO = '#4B5563';
export const COLOR_PRIMARIO = '#1D4ED8';

// Paleta categórica (series sin color semántico); cicla si hay más categorías.
const PALETA_CATEGORIAS = [
  '#1D4ED8',
  '#047857',
  '#B45309',
  '#7C3AED',
  '#B91C1C',
  '#0E7490',
  '#BE185D',
  '#4B5563',
];

// Prioridad: éxito (baja) → primario (media) → advertencia (alta) → peligro (crítica).
const COLORES_PRIORIDAD = {
  BAJA: '#047857',
  MEDIA: '#1D4ED8',
  ALTA: '#B45309',
  CRITICA: '#B91C1C',
};

// Nombres visibles de UX §2.1 para los 6 estados fijos (ADR-009).
const ETIQUETAS_ESTADO = {
  REGISTRADA: 'Registrada',
  EN_EVALUACION: 'En evaluación',
  ASIGNADA: 'Asignada',
  EN_ATENCION: 'En atención',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};

const HEX_COLOR = /^#[0-9A-F]{6}$/i;
const formateadorValor = new Intl.NumberFormat('es-PE');
const formateadorPorcentaje = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 1,
});

export function totalDatos(datos) {
  return (datos ?? []).reduce((suma, d) => suma + (d.valor ?? 0), 0);
}

/** Porcentaje con un decimal; 0 si el total es 0 (misma regla que RN-11). */
export function porcentaje(valor, total) {
  if (!total) return 0;
  return Math.round((valor / total) * 1000) / 10;
}

export function formatValor(valor) {
  return formateadorValor.format(valor);
}

export function formatPorcentaje(valor) {
  return `${formateadorPorcentaje.format(valor)} %`;
}

/**
 * Colores para `cantidad` categorías, en orden. La paleta cicla, pero se evita que
 * dos colores contiguos coincidan, incluida la última con la primera (dona circular).
 */
export function coloresCategorias(cantidad) {
  const colores = [];
  for (let i = 0; i < cantidad; i++) {
    let indice = i % PALETA_CATEGORIAS.length;
    if (i === cantidad - 1 && i > 0 && PALETA_CATEGORIAS[indice] === colores[0]) {
      indice = (indice + 1) % PALETA_CATEGORIAS.length;
    }
    colores.push(PALETA_CATEGORIAS[indice]);
  }
  return colores;
}

function normalizar(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

export function colorPrioridad(nombre) {
  return COLORES_PRIORIDAD[normalizar(nombre)] ?? COLOR_NEUTRO;
}

/** Usa el `colorHex` del catálogo; solo acepta `#RRGGBB` (se escribe en un atributo SVG). */
export function colorEstado(colorHex) {
  return typeof colorHex === 'string' && HEX_COLOR.test(colorHex) ? colorHex : COLOR_NEUTRO;
}

export function etiquetaEstado(codigo) {
  if (ETIQUETAS_ESTADO[codigo]) return ETIQUETAS_ESTADO[codigo];
  const texto = String(codigo ?? '')
    .replaceAll('_', ' ')
    .toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const ETIQUETAS_PRIORIDAD = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export function etiquetaPrioridad(nombre) {
  const clave = normalizar(nombre);
  if (ETIQUETAS_PRIORIDAD[clave]) return ETIQUETAS_PRIORIDAD[clave];
  const texto = String(nombre ?? '').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function ordenarPorValorDesc(datos) {
  return [...(datos ?? [])].sort((a, b) => b.valor - a.valor);
}
