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

// `2026-10-03` → `03/10/2026` sin pasar por Date (evita desfases de zona horaria).
function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Texto del rango aplicado, igual a como lo resuelve el backend (DashboardService): sin fechas,
 * últimos 30 días; solo `hasta`, los 30 días que terminan ese día; solo `desde`, hasta hoy.
 */
export function describirRango({ desde, hasta } = {}) {
  if (desde && hasta) return `del ${formatearFecha(desde)} al ${formatearFecha(hasta)}`;
  if (desde) return `desde el ${formatearFecha(desde)} hasta hoy`;
  if (hasta) return `los 30 días hasta el ${formatearFecha(hasta)}`;
  return 'últimos 30 días';
}
