import { iniciarApp } from '../shell.js';
import { api } from '../api.js';
import { enlazarValidacion, aplicarErroresServidor } from '../forms.js';
import {
  MENSAJES, DESCRIPCION_MIN, DESCRIPCION_MAX, MAX_ARCHIVOS,
  validarTitulo, validarDescripcion, validarTextoCorto, validarArchivos, formatearContador, contarCaracteres,
} from '../lib/validation.js';
import { formatearTamano } from '../lib/format.js';
import { el, etiquetaPrioridad, mostrarCarga, mostrarError, limpiarEstado, marcarCargando } from '../ui.js';

const CLAVE_BORRADOR = 'gestion_univ_borrador_solicitud';

const borrador = {
  leer() {
    try {
      return JSON.parse(window.sessionStorage.getItem(CLAVE_BORRADOR) ?? '{}');
    } catch {
      return {};
    }
  },
  guardar(valores) {
    try {
      window.sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(valores));
    } catch { /* sin sessionStorage: no hay borrador */ }
  },
  limpiar() {
    try {
      window.sessionStorage.removeItem(CLAVE_BORRADOR);
    } catch { /* nada */ }
  },
};

const CAMPOS_BORRADOR = ['titulo', 'idCategoria', 'idPrioridad', 'ubicacionCampus', 'ubicacionAmbiente', 'descripcion'];

if (await iniciarApp()) await iniciar();

async function iniciar() {
  const estadoCatalogos = document.getElementById('estado-catalogos');
  const formulario = document.getElementById('form-solicitud');

  async function cargarCatalogos() {
    mostrarCarga(estadoCatalogos, 3);
    try {
      const [categorias, prioridades, campus] = await Promise.all([api.categorias(), api.prioridades(), api.campus()]);
      limpiarEstado(estadoCatalogos);
      const llenar = (select, opciones) => select.append(...opciones.map(([v, t]) => el('option', { value: v, text: t })));
      llenar(formulario.elements.idCategoria, categorias.map((c) => [c.id, c.nombre]));
      llenar(formulario.elements.idPrioridad, prioridades.map((p) => [p.id, etiquetaPrioridad(p.nivel)]));
      llenar(formulario.elements.ubicacionCampus, campus.map((c) => [c.nombre, c.nombre]));
      formulario.hidden = false;
      restaurarBorrador(formulario);
      actualizarContador();
    } catch (error) {
      if (!error.problema) throw error;
      mostrarError(estadoCatalogos, { mensaje: error.problema.mensaje, onReintentar: cargarCatalogos });
    }
  }

  // ---- Contador de caracteres en vivo ----
  const descripcion = formulario.elements.descripcion;
  const contador = document.getElementById('descripcion-ayuda');
  function actualizarContador() {
    const n = contarCaracteres(descripcion.value);
    contador.textContent = `${formatearContador(n, DESCRIPCION_MAX)} · mínimo ${DESCRIPCION_MIN}`;
    contador.dataset.estado = n >= DESCRIPCION_MIN ? 'ok' : 'corta';
  }

  // ---- Evidencias: FileReader + validación ----
  const adjuntos = [];
  const lista = document.getElementById('lista-archivos');
  const erroresArchivos = document.getElementById('errores-archivos');
  const entrada = document.getElementById('archivos');
  const zona = document.getElementById('dropzone');

  function pintarAdjuntos() {
    lista.replaceChildren(
      ...adjuntos.map((a, i) =>
        el(
          'li',
          { class: 'file-item' },
          a.vista ? el('img', { src: a.vista, alt: `Vista previa de ${a.archivo.name}` }) : el('span', { class: 'file-icon', 'aria-hidden': 'true', text: 'PDF' }),
          el('span', { class: 'file-meta' }, el('strong', { text: a.archivo.name }), el('span', { class: 'hint', text: formatearTamano(a.archivo.size) })),
          el('button', {
            class: 'btn btn--secondary', type: 'button', 'aria-label': `Quitar ${a.archivo.name}`, text: '✕',
            onclick: () => { adjuntos.splice(i, 1); pintarAdjuntos(); },
          }),
        ),
      ),
    );
  }

  function leerVista(archivo) {
    return new Promise((resolver) => {
      if (!archivo.type.startsWith('image/')) return resolver(null);
      const lector = new FileReader();
      lector.addEventListener('load', () => resolver(lector.result));
      lector.addEventListener('error', () => resolver(null));
      lector.readAsDataURL(archivo);
    });
  }

  async function agregarArchivos(seleccion) {
    const { validos, errores } = validarArchivos(Array.from(seleccion), { yaAdjuntos: adjuntos.length });
    erroresArchivos.replaceChildren(...errores.map((e) => el('p', { class: 'field-error', text: `${e.nombre}: ${e.mensaje}` })));
    for (const archivo of validos) adjuntos.push({ archivo, vista: await leerVista(archivo) });
    pintarAdjuntos();
  }

  entrada.addEventListener('change', async () => {
    await agregarArchivos(entrada.files);
    entrada.value = '';
  });
  for (const tipo of ['dragenter', 'dragover']) {
    zona.addEventListener(tipo, (e) => { e.preventDefault(); zona.dataset.arrastrando = 'true'; });
  }
  for (const tipo of ['dragleave', 'drop']) {
    zona.addEventListener(tipo, (e) => { e.preventDefault(); delete zona.dataset.arrastrando; });
  }
  zona.addEventListener('drop', (e) => agregarArchivos(e.dataTransfer.files));

  // ---- Validación ----
  const elegir = (v) => (v ? null : MENSAJES.seleccionaOpcion);
  const validarTodo = enlazarValidacion(
    formulario,
    {
      titulo: validarTitulo,
      idCategoria: elegir,
      idPrioridad: elegir,
      ubicacionCampus: elegir,
      ubicacionAmbiente: (v) => validarTextoCorto(v, 'Ubicación'),
      descripcion: validarDescripcion,
    },
    { alCambiar: (campo) => { if (campo === descripcion) actualizarContador(); guardarBorrador(); } },
  );

  function guardarBorrador() {
    borrador.guardar(Object.fromEntries(CAMPOS_BORRADOR.map((c) => [c, formulario.elements[c].value])));
  }
  function restaurarBorrador(f) {
    for (const [campo, valor] of Object.entries(borrador.leer())) {
      if (CAMPOS_BORRADOR.includes(campo)) f.elements[campo].value = valor;
    }
  }
  formulario.addEventListener('change', guardarBorrador);

  // ---- Envío: FormData con parte JSON "solicitud" + "archivos" ----
  const boton = document.getElementById('enviar');
  const aviso = document.getElementById('aviso');

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    aviso.replaceChildren();
    if (!validarTodo()) return;

    const f = formulario.elements;
    const datos = {
      idCategoria: Number(f.idCategoria.value),
      idPrioridad: Number(f.idPrioridad.value),
      titulo: f.titulo.value.trim(),
      descripcion: f.descripcion.value.trim(),
      ubicacionCampus: f.ubicacionCampus.value,
      ubicacionAmbiente: f.ubicacionAmbiente.value.trim(),
    };
    const cuerpo = new FormData();
    cuerpo.append('solicitud', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    for (const { archivo } of adjuntos.slice(0, MAX_ARCHIVOS)) cuerpo.append('archivos', archivo, archivo.name);

    marcarCargando(boton, true);
    try {
      mostrarConfirmacion(await api.crearSolicitud(cuerpo));
    } catch (error) {
      marcarCargando(boton, false);
      const { problema } = error;
      if (!problema) throw error;
      if (problema.status === 400 && aplicarErroresServidor(formulario, problema.errores)) return;
      aviso.replaceChildren(el('p', { class: 'alert alert--error', text: problema.mensaje }));
    }
  });

  function mostrarConfirmacion(respuesta) {
    borrador.limpiar();
    const caja = document.getElementById('confirmacion');
    formulario.hidden = true;
    caja.hidden = false;
    caja.replaceChildren(
      el(
        'div',
        { class: 'state-box', role: 'status' },
        el('h2', { tabindex: '-1', text: '✔ Registrada' }),
        el('p', {}, 'Tu solicitud ', el('strong', { text: respuesta.codigo }), ' fue registrada. Te avisaremos cuando cambie de estado.'),
        el(
          'div',
          { class: 'actions' },
          el('a', { class: 'btn', href: 'mis-solicitudes.html', text: 'Ver mi solicitud' }),
          el('a', { class: 'btn btn--secondary', href: 'nueva-solicitud.html', text: 'Registrar otra' }),
        ),
      ),
    );
    caja.querySelector('h2').focus();
  }

  await cargarCatalogos();
}
