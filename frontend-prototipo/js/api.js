// Cliente de la API simulada. Normaliza los errores RFC 7807 con lib/errors.js.
import { normalizarError, ApiError } from './lib/errors.js';
import { sesion } from './auth.js';

export const API_BASE = '/api/v1';

// Controles de la maqueta (solo para demostrar estados): ?mock=500 · ?delay=800 · ?vacio=1
function cabecerasMock(metodo) {
  const q = new URLSearchParams(window.location.search);
  const h = {};
  // ?mock=500 afecta a todas las peticiones; ?mock=post:409 solo a las escrituras.
  const [, soloEscrituras, estado] = /^(post:)?(\d{3})$/.exec(q.get('mock') ?? '') ?? [];
  if (estado && (!soloEscrituras || metodo !== 'GET')) h['X-Mock-Status'] = estado;
  if (q.get('delay')) h['X-Mock-Delay'] = q.get('delay');
  if (q.get('vacio')) h['X-Mock-Empty'] = '1';
  return h;
}

export async function peticion(ruta, { metodo = 'GET', cuerpo, contexto, publica = false, sinMock = false } = {}) {
  const headers = { Accept: 'application/json, application/problem+json', ...(sinMock ? {} : cabecerasMock(metodo)) };
  const auth = sesion.leer();
  if (!publica && auth) headers.Authorization = `${auth.tipo} ${auth.token}`;

  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo; // el navegador fija multipart/form-data con su boundary
  } else if (cuerpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, { method: metodo, headers, body });
  } catch {
    throw new ApiError(normalizarError(0, null));
  }

  if (respuesta.status === 204) return null;
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    /* cuerpo vacío o no JSON */
  }
  if (!respuesta.ok) {
    const problema = normalizarError(respuesta.status, datos, { contexto });
    if (respuesta.status === 401 && contexto !== 'login') {
      sesion.limpiar();
      window.location.replace('login.html?expirada=1');
    }
    throw new ApiError(problema);
  }
  return datos;
}

export const api = {
  login: (credenciales) => peticion('/auth/login', { metodo: 'POST', cuerpo: credenciales, contexto: 'login', publica: true }),
  registro: (datos) => peticion('/auth/registro', { metodo: 'POST', cuerpo: datos, publica: true }),
  sesionDemo: (alias) => peticion(`/mock/sesion/${encodeURIComponent(alias)}`, { publica: true, sinMock: true }),
  misSolicitudes: () => peticion('/solicitudes/mis-solicitudes?size=100'),
  bandeja: () => peticion('/solicitudes?size=100'),
  crearSolicitud: (formData) => peticion('/solicitudes', { metodo: 'POST', cuerpo: formData }),
  categorias: () => peticion('/categorias'),
  prioridades: () => peticion('/prioridades'),
  estados: () => peticion('/estados'),
  campus: () => peticion('/campus'),
  kpis: () => peticion('/dashboard/kpis'),
  porCategoria: () => peticion('/dashboard/por-categoria'),
  porPrioridad: () => peticion('/dashboard/por-prioridad'),
  porEstado: () => peticion('/dashboard/por-estado'),
  porResponsable: () => peticion('/dashboard/por-responsable'),
};
