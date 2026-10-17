// Cálculo del indicador de SLA (UX §2.3 y §8). Puro: el instante actual llega por parámetro.
const HORA_MS = 3_600_000;
const UMBRAL_POR_VENCER_H = 4;
const ESTADOS_FINALES = ['RESUELTA', 'CERRADA'];
const CON_DESFASE = /(Z|[+-]\d{2}:?\d{2})$/i;

// El backend usa `Clock.systemUTC()` y serializa `LocalDateTime` sin desfase ("2026-10-04T15:00:00"):
// `new Date` lo tomaría como hora local del navegador (en Lima, 5 h de error). Sin desfase se lee como UTC.
function aMilisegundos(fecha) {
  const texto = String(fecha);
  return new Date(CON_DESFASE.test(texto) ? texto : `${texto}Z`).getTime();
}

function textoRestante(horas) {
  if (horas < 1) return 'Vence en menos de 1 h';
  if (horas < 48) return `Vence en ${Math.floor(horas)} h`;
  return `Vence en ${Math.floor(horas / 24)} d`;
}

/**
 * Clasifica el SLA de una solicitud: `{ nivel, texto }` con `nivel` en
 * `vencida | porVencer | aTiempo | atendida | sinSla`. Se confía en `vencida` del API (su reloj es
 * el que cuenta); solo si no llega se decide por la fecha límite. Una solicitud resuelta o cerrada
 * no corre SLA. El tiempo restante se redondea hacia abajo para no sobrestimarlo.
 */
export function estadoSla({ fechaLimiteSla, vencida, estadoCodigo, ahora }) {
  if (ESTADOS_FINALES.includes(estadoCodigo)) return { nivel: 'atendida', texto: 'Atendida' };
  if (!fechaLimiteSla) return { nivel: 'sinSla', texto: 'Sin SLA' };
  const restanteMs = aMilisegundos(fechaLimiteSla) - ahora;
  const estaVencida = typeof vencida === 'boolean' ? vencida : restanteMs <= 0;
  if (estaVencida) return { nivel: 'vencida', texto: 'Vencida' };
  const horas = Math.max(restanteMs, 0) / HORA_MS;
  return {
    nivel: horas <= UMBRAL_POR_VENCER_H ? 'porVencer' : 'aTiempo',
    texto: textoRestante(horas),
  };
}
