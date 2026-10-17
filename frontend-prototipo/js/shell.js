// Cascarón de las páginas autenticadas: guarda de sesión, cabecera, menú por rol y logout.
import { sesion } from './auth.js';
import { api } from './api.js';
import { menuPara, puedeVer, rutaInicial } from './lib/roles.js';
import { el } from './ui.js';

const ETIQUETA_ROL = { ESTUDIANTE: 'Estudiante', TECNICO: 'Técnico', SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' };

// Solo maqueta: ?demo=<alias> abre una sesión de demostración (ver README).
async function abrirSesionDemo() {
  const url = new URL(window.location.href);
  const alias = url.searchParams.get('demo');
  if (!alias) return;
  try {
    sesion.guardar(await api.sesionDemo(alias));
  } catch {
    /* alias desconocido: se ignora y la guarda llevará al login */
  }
  url.searchParams.delete('demo');
  window.history.replaceState(null, '', url);
}

export async function iniciarApp() {
  await abrirSesionDemo();
  const auth = sesion.leer();
  const pagina = window.location.pathname.split('/').pop() || 'index.html';
  if (!auth) {
    window.location.replace('login.html');
    return null;
  }
  if (!puedeVer(auth.usuario.rol, pagina)) {
    window.location.replace(rutaInicial(auth.usuario.rol));
    return null;
  }
  montarCascaron(auth, pagina);
  return auth;
}

function montarCascaron({ usuario }, pagina) {
  document.body.dataset.shell = '';
  const menu = el('button', { class: 'btn btn--secondary btn-menu', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-principal', 'aria-label': 'Abrir menú', text: '☰' });
  const cerrar = el('button', { class: 'btn btn--secondary btn-close', type: 'button', 'aria-label': 'Cerrar menú', text: '✕' });
  const salir = el('button', { class: 'btn btn--secondary', type: 'button', text: 'Cerrar sesión' });
  salir.addEventListener('click', () => {
    sesion.limpiar();
    window.location.replace('login.html');
  });

  const enlaces = menuPara(usuario.rol).map((item) =>
    el('li', {}, el('a', { href: item.href, 'aria-current': item.href === pagina ? 'page' : false, text: item.etiqueta })),
  );
  const nav = el('nav', { id: 'nav-principal', class: 'app-nav', 'aria-label': 'Principal' }, cerrar, el('ul', {}, enlaces));
  const scrim = el('div', { class: 'scrim', hidden: true });

  const cabecera = el(
    'header',
    { class: 'app-header' },
    menu,
    el('a', { class: 'brand', href: rutaInicial(usuario.rol) }, el('span', { class: 'brand-corto', text: 'Servicios' }), el('span', { class: 'brand-largo', text: 'Servicios Universitarios' })),
    el('span', { class: 'user-chip', text: `${usuario.nombre} ${usuario.apellido} · ${ETIQUETA_ROL[usuario.rol] ?? usuario.rol}` }),
    salir,
  );

  const alternar = (abierto) => {
    nav.dataset.abierto = String(abierto);
    scrim.hidden = !abierto;
    menu.setAttribute('aria-expanded', String(abierto));
    (abierto ? cerrar : menu).focus();
  };
  menu.addEventListener('click', () => alternar(true));
  cerrar.addEventListener('click', () => alternar(false));
  scrim.addEventListener('click', () => alternar(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.dataset.abierto === 'true') alternar(false);
  });
  // Mientras el menú está abierto, Tab y Shift+Tab no salen de él (modal accesible).
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || nav.dataset.abierto !== 'true') return;
    const foco = [...nav.querySelectorAll('a[href], button')];
    const primero = foco[0];
    const ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });

  const salto = el('a', { class: 'skip-link', href: '#contenido', text: 'Saltar al contenido' });
  document.body.prepend(salto, cabecera, nav, scrim);
}
