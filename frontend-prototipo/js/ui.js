// Utilidades de DOM. Regla de seguridad (seguridad-owasp.md): jamás innerHTML con datos;
// todo texto entra por textContent / createTextNode.

export function el(etiqueta, props = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(props)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave === 'class') nodo.className = valor;
    else if (clave === 'text') nodo.textContent = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

export const vaciar = (nodo) => nodo.replaceChildren();

const ETIQUETA_PRIORIDAD = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica' };
const ICONO_PRIORIDAD = { BAJA: '▽', MEDIA: '●', ALTA: '▲', CRITICA: '■' };
export const etiquetaPrioridad = (p) => ETIQUETA_PRIORIDAD[p] ?? p;

export function tagPrioridad(prioridad) {
  return el('span', { class: `tag tag--${prioridad}` }, el('span', { 'aria-hidden': 'true', text: ICONO_PRIORIDAD[prioridad] ?? '•' }), etiquetaPrioridad(prioridad));
}

// EstadoBadge: texto + punto de color (el color nunca es el único indicador).
export function badgeEstado(codigo, estados) {
  const info = estados.find((e) => e.codigo === codigo);
  const badge = el('span', { class: 'badge', text: info?.nombreVisible ?? codigo });
  badge.style.setProperty('--badge-color', info?.colorHex ?? '#6b7280');
  return badge;
}

// Toasts solo para confirmaciones (éxito/info): se descartan solos. Los errores se muestran
// una única vez, en línea (role="alert"), junto al formulario o la lista.
let zonaToast;
export function toast(mensaje, tipo = 'success') {
  if (!zonaToast) {
    zonaToast = el('div', { class: 'toast-zone' });
    document.body.append(zonaToast);
  }
  const aviso = el('div', { class: `alert alert--${tipo}`, role: 'status', text: mensaje });
  zonaToast.append(aviso);
  setTimeout(() => aviso.remove(), 5000);
  return aviso;
}

// ---- Estados de pantalla (UX §2.5) ----
export function mostrarCarga(contenedor, filas = 4) {
  vaciar(contenedor);
  contenedor.setAttribute('aria-busy', 'true');
  contenedor.append(
    el('p', { class: 'sr-only', role: 'status', text: 'Cargando…' }),
    el('div', { class: 'skeleton-list', 'aria-hidden': 'true' }, Array.from({ length: filas }, () => el('div', { class: 'skeleton' }))),
  );
}

export function mostrarVacio(contenedor, { mensaje, accion }) {
  vaciar(contenedor);
  contenedor.removeAttribute('aria-busy');
  contenedor.append(
    el('div', { class: 'state-box' }, el('p', { text: mensaje }), accion && el('a', { class: 'btn', href: accion.href, text: accion.texto })),
  );
}

export function mostrarError(contenedor, { mensaje, onReintentar }) {
  vaciar(contenedor);
  contenedor.removeAttribute('aria-busy');
  contenedor.append(
    el('div', { class: 'state-box' }, el('p', { class: 'alert alert--error', role: 'alert', text: mensaje }), onReintentar && el('button', { class: 'btn btn--secondary', type: 'button', onclick: onReintentar, text: 'Reintentar' })),
  );
}

export function limpiarEstado(contenedor) {
  vaciar(contenedor);
  contenedor.removeAttribute('aria-busy');
}

// Botón con spinner mientras envía (evita doble envío).
export function marcarCargando(boton, cargando, textoCargando = 'Enviando…') {
  if (cargando) {
    boton.dataset.texto = boton.textContent;
    boton.disabled = true;
    boton.replaceChildren(el('span', { class: 'spinner', 'aria-hidden': 'true' }), textoCargando);
  } else {
    boton.disabled = false;
    boton.textContent = boton.dataset.texto ?? boton.textContent;
  }
}

// Muestra/limpia el error de un campo y enlaza aria-describedby / aria-invalid.
export function mostrarErrorCampo(campo, mensaje) {
  const salida = document.getElementById(`${campo.id}-error`);
  campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  if (salida) salida.textContent = mensaje ?? '';
}
