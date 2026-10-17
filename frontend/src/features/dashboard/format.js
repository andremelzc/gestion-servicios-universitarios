// Formato numérico es-PE para los indicadores del dashboard.
export const SIN_DATO = '—';

const formateador = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });

export function esNumero(valor) {
  return typeof valor === 'number' && Number.isFinite(valor);
}

/** Número en es-PE con un decimal como máximo; "—" si no hay dato (null, undefined o no numérico). */
export function formatNumero(valor) {
  if (!esNumero(valor)) return SIN_DATO;
  return formateador.format(valor);
}
