// Cálculo del indicador de SLA (UX §2.3 y §8). Puro: el instante actual llega por parámetro.
const HORA_MS = 3_600_000;
const UMBRAL_POR_VENCER_H = 4;
const ESTADOS_FINALES = ['RESUELTA', 'CERRADA'];

function textoRestante(horas) {
  if (horas < 1) return 'Vence en menos de 1 h';
  if (horas < 48) return `Vence en ${Math.round(horas)} h`;
  return `Vence en ${Math.round(horas / 24)} d`;
}

/**
 * Clasifica el SLA de una solicitud: `{ nivel, texto }` con `nivel` en
 * `vencida | porVencer | aTiempo | atendida | sinSla`. `vencida` (calculada por el API) o una
 * fecha límite ya pasada cuentan como vencida; una solicitud resuelta o cerrada no corre SLA.
 */
export function estadoSla({ fechaLimiteSla, vencida = false, estadoCodigo, ahora }) {
  if (ESTADOS_FINALES.includes(estadoCodigo)) return { nivel: 'atendida', texto: 'Atendida' };
  if (!fechaLimiteSla) return { nivel: 'sinSla', texto: 'Sin SLA' };
  const restanteMs = new Date(fechaLimiteSla).getTime() - ahora;
  if (vencida || restanteMs <= 0) return { nivel: 'vencida', texto: 'Vencida' };
  const horas = restanteMs / HORA_MS;
  return {
    nivel: horas <= UMBRAL_POR_VENCER_H ? 'porVencer' : 'aTiempo',
    texto: textoRestante(horas),
  };
}
