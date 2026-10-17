// Cliente HTTP único del frontend (AUTH-15 · API §1.2, ADR-012, arquitectura §4.2).
// - Petición: base `VITE_API_URL` (services/config.js), `Authorization: Bearer` desde la
//   sesión persistida (misma clave que AuthContext, AUTH-03) y JSON automático
//   (FormData/multipart pasa tal cual, sin forzar `Content-Type`).
// - Respuesta: errores RFC 7807 normalizados a `{status, detail, errores, traceId, tipo?,
//   sinConexion?}` — el contrato que ya esperan `interpretarError` (services/errores.js),
//   `DataTable` y las páginas por venir.
// - 401 fuera de `/auth/login`: la sesión expiró → se borra, se deja el aviso de UX §9 y se
//   navega a /login; la LoginPage (AUTH-16) lo muestra con `consumirAvisoSesion()`.
import { API_URL } from './config.js';

// Misma clave que `STORAGE_KEY` de `features/auth/AuthContext.jsx`; la prueba de este módulo
// verifica que no se desincronicen.
export const CLAVE_SESION = 'gestion_univ_auth';

// Aviso de una sola lectura para la LoginPage; en `sessionStorage` sobrevive a la recarga.
export const CLAVE_AVISO_SESION = 'gestion_univ_aviso_sesion';

// Microcopy de UX §9 (sesión expirada).
export const AVISO_SESION_EXPIRADA = 'Tu sesión expiró. Inicia sesión de nuevo.';

// Ruta del contrato (su 401 no dispara el manejo global: lo pinta la página) y ruta de la app.
export const RUTA_LOGIN_API = '/auth/login';
export const RUTA_LOGIN = '/login';

// Lee el token de la sesión persistida. Sin sesión (o corrupta) devuelve `null`.
function leerToken() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo);
    return typeof sesion?.token === 'string' ? sesion.token : null;
  } catch {
    return null;
  }
}

function borrarSesionPersistida() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}

/**
 * Acción por defecto ante un 401 de sesión: limpia la sesión persistida (AuthContext limpia
 * además su estado en memoria cuando se integre), deja el aviso para la LoginPage y navega.
 * `navegar` es inyectable para las pruebas.
 */
export function expirarSesion({ navegar = (ruta) => window.location.assign(ruta) } = {}) {
  borrarSesionPersistida();
  try {
    sessionStorage.setItem(CLAVE_AVISO_SESION, '1');
  } catch {
    // Sin almacenamiento: el aviso se pierde; la navegación sigue.
  }
  navegar(RUTA_LOGIN);
}

// Punto de extensión para que la app (p. ej. AuthProvider en AUTH-16/17) reaccione al 401 sin
// que `services/` dependa de React. Sin configurar, se usa `expirarSesion`.
let alExpirarSesion = expirarSesion;

/** Reemplaza (o restaura) el manejador global de sesión expirada. `configurarApiClient()` resetea. */
export function configurarApiClient({ alExpirarSesion: manejador } = {}) {
  alExpirarSesion = manejador ?? expirarSesion;
}

/** Lee y consume el aviso de sesión expirada (una sola vez). Devuelve el microcopy o `null`. */
export function consumirAvisoSesion() {
  try {
    const presente = sessionStorage.getItem(CLAVE_AVISO_SESION) != null;
    sessionStorage.removeItem(CLAVE_AVISO_SESION);
    return presente ? AVISO_SESION_EXPIRADA : null;
  } catch {
    return null;
  }
}

// RFC 7807 → forma única del frontend (ADR-012). `tipo` es el último segmento de `type`:
// permite distinguir los 409 de negocio (ver services/errores.js).
function normalizarError(status, cuerpo) {
  const tipo = typeof cuerpo?.type === 'string' ? cuerpo.type.split('/').pop() : undefined;
  return {
    status,
    detail: typeof cuerpo?.detail === 'string' ? cuerpo.detail : null,
    errores: cuerpo?.errores ?? {},
    traceId: cuerpo?.traceId ?? null,
    ...(tipo ? { tipo } : {}),
  };
}

/**
 * Petición al API. Devuelve el cuerpo JSON (o `null` en 204) y lanza el error normalizado
 * `{status, detail, errores, traceId, tipo?}` (o `{status: 0, sinConexion: true}` sin red).
 */
export async function peticion(ruta, { method = 'GET', body, headers = {}, ...resto } = {}) {
  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const cabeceras = { ...headers };

  const token = leerToken();
  if (token && !cabeceras.Authorization) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let cuerpoEnviado = body;
  if (body != null && !esFormData) {
    cabeceras['Content-Type'] ??= 'application/json';
    cuerpoEnviado = JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: cabeceras,
      body: cuerpoEnviado,
      ...resto,
    });
  } catch {
    throw { status: 0, sinConexion: true };
  }

  // El cuerpo se lee una sola vez (json() falla con cuerpos vacíos como el 204).
  let cuerpo = null;
  if (respuesta.status !== 204) {
    const texto = await respuesta.text().catch(() => '');
    if (texto) {
      try {
        cuerpo = JSON.parse(texto);
      } catch {
        cuerpo = null;
      }
    }
  }

  if (!respuesta.ok) {
    const error = normalizarError(respuesta.status, cuerpo);
    if (respuesta.status === 401 && ruta !== RUTA_LOGIN_API) {
      alExpirarSesion();
    }
    throw error;
  }

  return cuerpo;
}

// Azúcar por verbo; `apiClient.peticion` sigue disponible para casos raros.
export const apiClient = {
  peticion,
  get: (ruta, opciones) => peticion(ruta, opciones),
  post: (ruta, body, opciones) => peticion(ruta, { ...opciones, method: 'POST', body }),
  put: (ruta, body, opciones) => peticion(ruta, { ...opciones, method: 'PUT', body }),
  patch: (ruta, body, opciones) => peticion(ruta, { ...opciones, method: 'PATCH', body }),
  del: (ruta, opciones) => peticion(ruta, { ...opciones, method: 'DELETE' }),
};
