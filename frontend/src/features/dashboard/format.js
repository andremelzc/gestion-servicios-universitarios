// Formato numérico es-PE para los indicadores del dashboard.
export const SIN_DATO = '—';

const formateador = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });

/** Número en es-PE con un decimal como máximo; "—" si no hay dato (null/undefined). */
export function formatNumero(valor) {
  if (valor === null || valor === undefined) return SIN_DATO;
  return formateador.format(valor);
}
