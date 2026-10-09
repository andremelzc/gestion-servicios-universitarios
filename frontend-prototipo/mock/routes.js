// Enrutado y autorización (RBAC + alcance RN-16) de las lecturas de la API simulada.
// Solo hay rutas explícitas: cualquier otra cosa es 404 RFC 7807. Función pura y probada.
import { problema } from './handlers.js';

const CATALOGOS = ['areas', 'categorias', 'prioridades', 'estados', 'campus'];
const DASHBOARD = {
  kpis: 'dashboardKpis',
  'por-categoria': 'dashboardPorCategoria',
  'por-prioridad': 'dashboardPorPrioridad',
  'por-estado': 'dashboardPorEstado',
  'por-responsable': 'dashboardPorResponsable',
};

const ok = (body) => ({ status: 200, body });
const error = (status, tipo, titulo, detalle, instance) => ({
  status,
  body: problema(status, tipo, titulo, detalle, instance),
});
const noEncontrado = (instance) => error(404, 'no-encontrado', 'No encontrado', 'Recurso no encontrado.', instance);
const prohibido = (instance, detalle = 'No tienes permiso para realizar esta acción.') =>
  error(403, 'acceso-denegado', 'Acceso denegado', detalle, instance);

const quitarPrivados = ({ solicitanteId, ...resumen }) => resumen;
const porFechaDesc = (a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro);

// Alcance por rol (api-rest.md §4): técnico → asignadas; supervisor → su área; admin → todas.
function alcance(db, usuario) {
  const { rol, idArea, nombre, apellido } = usuario;
  const area = db.areas.find((a) => a.id === idArea)?.nombre;
  if (rol === 'TECNICO') return (s) => s.tecnico === `${nombre} ${apellido}`;
  if (rol === 'SUPERVISOR') return (s) => s.area === area;
  if (rol === 'ADMIN') return () => true;
  return () => false;
}

function pagina(items, query, vacio) {
  const size = Math.min(Math.max(Number(query?.size) || 20, 1), 100);
  const page = Math.max(Number(query?.page) || 0, 0);
  const lista = vacio ? [] : items;
  return {
    content: lista.slice(page * size, page * size + size).map(quitarPrivados),
    page,
    size,
    totalElements: lista.length,
    totalPages: Math.ceil(lista.length / size),
  };
}

export function resolver({ db, usuario, metodo, ruta, query = {}, vacio = false, instance = ruta }) {
  if (metodo !== 'GET') {
    return error(405, 'metodo-no-permitido', 'Método no permitido', `${metodo} no está soportado en esta ruta.`, instance);
  }
  const partes = ruta.split('/').filter(Boolean);
  const [recurso, segundo, ...resto] = partes;

  if (CATALOGOS.includes(recurso) && partes.length === 1) {
    return ok(db[recurso].filter((x) => x.activo !== false));
  }

  if (recurso === 'auth' && segundo === 'me' && !resto.length) {
    const { password, alias, ...resumen } = usuario;
    return ok(resumen);
  }

  if (recurso === 'solicitudes') {
    if (partes.length === 1) {
      if (usuario.rol === 'ESTUDIANTE') return prohibido(instance, 'Un estudiante debe usar mis-solicitudes.');
      return ok(pagina(db.solicitudes.filter(alcance(db, usuario)).sort(porFechaDesc), query, vacio));
    }
    if (segundo === 'mis-solicitudes' && !resto.length) {
      return ok(pagina(db.solicitudes.filter((s) => s.solicitanteId === usuario.id).sort(porFechaDesc), query, vacio));
    }
    if (/^\d+$/.test(segundo) && !resto.length) {
      const s = db.solicitudes.find((x) => x.id === Number(segundo));
      const visible = s && (s.solicitanteId === usuario.id || alcance(db, usuario)(s));
      return visible ? ok(quitarPrivados(s)) : noEncontrado(instance);
    }
  }

  if (recurso === 'dashboard' && DASHBOARD[segundo] && !resto.length) {
    return usuario.rol === 'ESTUDIANTE' ? prohibido(instance, 'Sin permiso para el dashboard.') : ok(db[DASHBOARD[segundo]]);
  }

  return noEncontrado(instance);
}
