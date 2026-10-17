// Formateo de números, fechas y datos de gráficos (puro, testeable).

const TZ = 'America/Lima';
const VACIO = '—';
const esNumero = (n) => typeof n === 'number' && Number.isFinite(n);

export const formatearEntero = (n) => (esNumero(n) ? String(n) : VACIO);
export const formatearPorcentaje = (n) => (esNumero(n) ? `${n.toFixed(1)} %` : VACIO);
export const formatearHoras = (n) => (esNumero(n) ? `${n} h` : VACIO);

export function formatearTamano(bytes) {
  if (bytes >= 1024 * 1024) return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function formatearFechaLima(iso) {
  const partes = new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

export function tiempoRelativo(iso, ahora = new Date()) {
  const seg = Math.floor((ahora.getTime() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return 'hace un momento';
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function calcularBarras(datos) {
  const max = Math.max(0, ...datos.map((d) => d.valor));
  return datos.map((d) => ({ ...d, porcentaje: max === 0 ? 0 : Math.round((d.valor / max) * 100) }));
}

// Geometría de la dona: circunferencia normalizada a 100 (r = 100 / 2π ≈ 15.9155).
// El trazo se centra en el radio, así que el borde exterior es radio + grosor / 2 y debe caber en el lienzo.
export const DONA = { tamano: 36, centro: 18, radio: 15.9155, grosor: 4, viewBox: '0 0 36 36' };
export const radioExterno = () => DONA.radio + DONA.grosor / 2;

// Variable CSS de color de cada prioridad (las mismas que usan las etiquetas PrioridadTag).
export const VARIABLE_COLOR_PRIORIDAD = {
  CRITICA: '--color-danger',
  ALTA: '--color-warning',
  MEDIA: '--color-primary',
  BAJA: '--color-text-muted',
};

// Segmentos de dona SVG con circunferencia normalizada a 100 (r = 100 / 2π ≈ 15.9155).
export function calcularSegmentosDona(datos) {
  const total = datos.reduce((suma, d) => suma + d.valor, 0);
  let inicio = 0;
  return datos.map((d) => {
    const porcentaje = total === 0 ? 0 : (d.valor / total) * 100;
    const segmento = { ...d, porcentaje, inicio };
    inicio += porcentaje;
    return segmento;
  });
}

export function formatearKpis(kpis) {
  return [
    { clave: 'registradas', etiqueta: 'Registradas', valor: formatearEntero(kpis.registradas) },
    { clave: 'pendientes', etiqueta: 'Pendientes', valor: formatearEntero(kpis.pendientes) },
    { clave: 'atendidas', etiqueta: 'Atendidas', valor: formatearEntero(kpis.atendidas) },
    { clave: 'porcentajeResueltas', etiqueta: '% Resueltas', valor: formatearPorcentaje(kpis.porcentajeResueltas) },
    { clave: 'mttrHoras', etiqueta: 'MTTR', valor: formatearHoras(kpis.mttrHoras) },
    { clave: 'vencidas', etiqueta: 'Vencidas', valor: formatearEntero(kpis.vencidas) },
  ];
}
