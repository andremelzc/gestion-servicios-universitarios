import { iniciarApp } from '../shell.js';
import { api } from '../api.js';
import { formatearKpis, formatearFechaLima, calcularBarras, calcularSegmentosDona, DONA, VARIABLE_COLOR_PRIORIDAD } from '../lib/format.js';
import { el, etiquetaPrioridad, mostrarCarga, mostrarError, mostrarVacio, limpiarEstado } from '../ui.js';

const SVG = 'http://www.w3.org/2000/svg';
// Los colores viven en tokens.css; aquí solo se leen.
const colorCss = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
const paleta = () => [1, 2, 3, 4, 5, 6].map((n) => colorCss(`--chart-${n}`));

const svg = (nombre, atributos = {}) => {
  const nodo = document.createElementNS(SVG, nombre);
  for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
  return nodo;
};

const descripcion = (titulo, datos) =>
  `${titulo}: ${datos.map((d) => `${d.nombre} ${d.valor}`).join(', ')}.`;

// Alternativa accesible: tabla con los mismos datos.
function tablaDatos(columna, datos) {
  return el(
    'details',
    { class: 'chart-data' },
    el('summary', { text: 'Ver datos' }),
    el(
      'table',
      { class: 'data-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: columna }), el('th', { scope: 'col', text: 'Solicitudes' }))),
      el('tbody', {}, datos.map((d) => el('tr', {}, el('th', { scope: 'row', text: d.nombre }), el('td', { text: String(d.valor) })))),
    ),
  );
}

function tarjetaGrafico(titulo, columna, datos, cuerpo) {
  const id = `g-${titulo.replace(/\W+/g, '-').toLowerCase()}`;
  return el('article', { class: 'card chart-card', 'aria-labelledby': id }, el('h2', { id, text: titulo }), cuerpo, tablaDatos(columna, datos));
}

function dona(titulo, columna, datos) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const segmentos = calcularSegmentosDona(datos);
  const colores = paleta();
  const grafico = svg('svg', { class: 'donut', viewBox: DONA.viewBox, role: 'img', 'aria-label': descripcion(`Gráfico de dona, ${titulo.toLowerCase()}`, datos) });
  segmentos.forEach((s, i) => {
    grafico.append(
      svg('circle', {
        cx: String(DONA.centro), cy: String(DONA.centro), r: String(DONA.radio), 'stroke-width': String(DONA.grosor), stroke: colores[i % colores.length],
        'stroke-dasharray': `${s.porcentaje} ${100 - s.porcentaje}`,
        'stroke-dashoffset': String(25 - s.inicio),
      }),
    );
  });
  const centro = svg('text', { x: '18', y: '19.5' });
  centro.textContent = String(total);
  grafico.append(centro);

  const leyenda = el(
    'ul',
    { class: 'legend' },
    segmentos.map((s, i) => {
      const marca = el('span', { class: 'swatch', 'aria-hidden': 'true' });
      marca.style.background = colores[i % colores.length];
      return el('li', {}, marca, el('span', { text: s.nombre }), el('span', { class: 'val', text: `${s.valor} (${Math.round(s.porcentaje)} %)` }));
    }),
  );
  return tarjetaGrafico(titulo, columna, datos, el('div', { class: 'chart-body' }, grafico, leyenda));
}

function barras(titulo, columna, datos, { colorDe } = {}) {
  const filas = calcularBarras(datos).map((d) => {
    const relleno = el('div', { class: 'bar-fill' });
    relleno.style.width = `${d.porcentaje}%`;
    if (colorDe) relleno.style.background = colorDe(d);
    return el('li', { class: 'bar-row' }, el('div', { class: 'bar-label' }, el('span', { text: d.nombre }), el('strong', { text: String(d.valor) })), el('div', { class: 'bar-track' }, relleno));
  });
  const grafico = el('div', { class: 'chart-body chart-body--barras', role: 'img', 'aria-label': descripcion(`Gráfico de barras, ${titulo.toLowerCase()}`, datos) }, el('ul', { class: 'bars', 'aria-hidden': 'true' }, filas));
  return tarjetaGrafico(titulo, columna, datos, grafico);
}

async function iniciar() {
  const estado = document.getElementById('estado');
  const panel = document.getElementById('panel');

  async function cargar() {
    panel.hidden = true;
    mostrarCarga(estado, 3);
    try {
      const [kpis, porCategoria, porPrioridad, porEstado, porResponsable, estados] = await Promise.all([
        api.kpis(), api.porCategoria(), api.porPrioridad(), api.porEstado(), api.porResponsable(), api.estados(),
      ]);
      if (kpis.registradas === 0) {
        return mostrarVacio(estado, { mensaje: 'Todavía no hay solicitudes en el periodo seleccionado.' });
      }
      limpiarEstado(estado);
      const fecha = (iso) => formatearFechaLima(iso).slice(0, 10);
      document.getElementById('periodo').textContent = `Periodo: ${fecha(kpis.desde)} – ${fecha(kpis.hasta)}`;

      document.getElementById('kpis').replaceChildren(
        ...formatearKpis(kpis).map((k) => el('div', { class: 'card kpi' }, el('span', { class: 'valor', text: k.valor }), el('span', { class: 'etiqueta', text: k.etiqueta }))),
      );

      const nombreEstado = (codigo) => estados.find((e) => e.codigo === codigo)?.nombreVisible ?? codigo;
      document.getElementById('graficos').replaceChildren(
        dona('Por categoría', 'Categoría', porCategoria),
        barras('Por prioridad', 'Prioridad', porPrioridad.map((d) => ({ ...d, nivel: d.nombre, nombre: etiquetaPrioridad(d.nombre) })), { colorDe: (d) => colorCss(VARIABLE_COLOR_PRIORIDAD[d.nivel]) }),
        barras('Por responsable', 'Responsable', porResponsable),
        barras('Por estado', 'Estado', porEstado.map((d) => ({ ...d, nombre: nombreEstado(d.nombre) })), { colorDe: (d) => d.colorHex }),
      );
      panel.hidden = false;
    } catch (error) {
      if (!error.problema) throw error;
      mostrarError(estado, { mensaje: error.problema.mensaje, onReintentar: cargar });
    }
  }
  await cargar();
}

if (await iniciarApp()) await iniciar();
