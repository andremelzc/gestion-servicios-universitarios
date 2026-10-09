// Listado de solicitudes con filtros en vivo, tarjetas (móvil) y tabla (≥768 px).
// Lo usan "Mis solicitudes" y "Bandeja".
import { api } from './api.js';
import { filtrarSolicitudes, paginar, GRUPOS_ESTADO } from './lib/filters.js';
import { formatearFechaLima, tiempoRelativo } from './lib/format.js';
import { el, vaciar, badgeEstado, tagPrioridad, etiquetaPrioridad, mostrarCarga, mostrarVacio, mostrarError, limpiarEstado } from './ui.js';

const TAMANO_PAGINA = 8;
const GRUPOS = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'porAsignar', etiqueta: 'Por asignar' },
  { clave: 'enCurso', etiqueta: 'En curso' },
  { clave: 'resueltas', etiqueta: 'Resueltas' },
];

function celdaSla(s) {
  return s.vencida ? el('span', { class: 'vencida' }, '✖ Vencida') : el('span', {}, '✔ En plazo');
}

function tarjeta(s, estados, { verTecnico }) {
  return el(
    'li',
    { class: 'card sol-card' },
    el('div', { class: 'top' }, el('span', { class: 'codigo', text: s.codigo }), badgeEstado(s.estado, estados)),
    el('strong', { text: s.titulo }),
    el(
      'div',
      { class: 'meta' },
      tagPrioridad(s.prioridad),
      el('span', { text: tiempoRelativo(s.fechaRegistro) }),
      verTecnico && el('span', { text: `Técnico: ${s.tecnico ?? 'Sin asignar'}` }),
      s.vencida && el('span', { class: 'vencida' }, '✖ Vencida'),
    ),
  );
}

function tabla(items, estados, { verTecnico }) {
  const columnas = ['Código', 'Título', 'Estado', 'Prioridad', 'Registrada', ...(verTecnico ? ['Técnico'] : []), 'SLA'];
  return el(
    'div',
    { class: 'table-wrap' },
    el(
      'table',
      { class: 'table' },
      el('caption', { class: 'sr-only', text: 'Listado de solicitudes' }),
      el('thead', {}, el('tr', {}, columnas.map((c) => el('th', { scope: 'col', text: c })))),
      el(
        'tbody',
        {},
        items.map((s) =>
          el(
            'tr',
            {},
            el('th', { scope: 'row', text: s.codigo }),
            el('td', { text: s.titulo }),
            el('td', {}, badgeEstado(s.estado, estados)),
            el('td', {}, tagPrioridad(s.prioridad)),
            el('td', { text: formatearFechaLima(s.fechaRegistro) }),
            verTecnico && el('td', { text: s.tecnico ?? 'Sin asignar' }),
            el('td', {}, celdaSla(s)),
          ),
        ),
      ),
    ),
  );
}

export async function iniciarListado({ cargar, verTecnico = false, conGrupos = false, grupoInicial = 'todas', vacio }) {
  const raiz = document.getElementById('resultado');
  const contador = document.getElementById('contador');
  const pager = document.getElementById('pager');
  const formulario = document.getElementById('filtros');
  const tabs = document.getElementById('tabs');
  const estado = { grupo: grupoInicial, pagina: 0 };
  let datos = [];
  let estados = [];

  const llenarSelect = (select, opciones) =>
    select.append(...opciones.map(([valor, texto]) => el('option', { value: valor, text: texto })));

  function pintar() {
    const filtros = {
      q: formulario.elements.q.value,
      estado: formulario.elements.estado.value,
      prioridad: formulario.elements.prioridad.value,
      estados: conGrupos && estado.grupo !== 'todas' ? GRUPOS_ESTADO[estado.grupo] : undefined,
    };
    const filtrados = filtrarSolicitudes(datos, filtros);
    const p = paginar(filtrados, estado.pagina, TAMANO_PAGINA);
    estado.pagina = p.page;
    limpiarEstado(raiz);
    vaciar(pager);

    if (datos.length === 0) {
      contador.textContent = '';
      return mostrarVacio(raiz, { mensaje: vacio.mensaje, accion: vacio.accion });
    }
    contador.textContent = `${p.totalElements} ${p.totalElements === 1 ? 'resultado' : 'resultados'}`;
    if (p.totalElements === 0) {
      return mostrarVacio(raiz, { mensaje: 'No hay solicitudes que coincidan con los filtros. Prueba con otros criterios.' });
    }
    raiz.append(
      el('ul', { class: 'card-list card-list--responsive' }, p.content.map((s) => tarjeta(s, estados, { verTecnico }))),
      tabla(p.content, estados, { verTecnico }),
    );
    if (p.totalPages > 1) {
      pager.append(
        el('button', { class: 'btn btn--secondary', type: 'button', disabled: p.page === 0, onclick: () => { estado.pagina -= 1; pintar(); }, text: '‹ Anterior' }),
        el('span', { text: `Página ${p.page + 1} de ${p.totalPages}` }),
        el('button', { class: 'btn btn--secondary', type: 'button', disabled: p.page >= p.totalPages - 1, onclick: () => { estado.pagina += 1; pintar(); }, text: 'Siguiente ›' }),
      );
    }
  }

  function pintarTabs() {
    if (!tabs) return;
    vaciar(tabs);
    tabs.append(
      ...GRUPOS.map((g) =>
        el('button', {
          class: 'tab', type: 'button', 'aria-pressed': String(g.clave === estado.grupo), text: g.etiqueta,
          onclick: () => { estado.grupo = g.clave; estado.pagina = 0; pintarTabs(); pintar(); },
        }),
      ),
    );
  }

  async function cargarDatos() {
    mostrarCarga(raiz);
    contador.textContent = '';
    try {
      const [pagina, listaEstados, prioridades] = await Promise.all([cargar(), api.estados(), api.prioridades()]);
      datos = pagina.content;
      estados = listaEstados;
      if (formulario.elements.estado.options.length === 1) {
        llenarSelect(formulario.elements.estado, listaEstados.map((e) => [e.codigo, e.nombreVisible]));
        llenarSelect(formulario.elements.prioridad, prioridades.map((p) => [p.nivel, etiquetaPrioridad(p.nivel)]));
      }
      pintarTabs();
      pintar();
    } catch (error) {
      if (!error.problema) throw error;
      mostrarError(raiz, { mensaje: error.problema.mensaje, onReintentar: cargarDatos });
    }
  }

  const refiltrar = () => { estado.pagina = 0; pintar(); };
  formulario.addEventListener('input', refiltrar);
  formulario.addEventListener('change', refiltrar);
  formulario.addEventListener('submit', (e) => e.preventDefault());
  await cargarDatos();
}
