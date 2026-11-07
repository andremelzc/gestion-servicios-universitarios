import { http, HttpResponse } from 'msw';
import { areasEjemplo } from './areas.js';
import { problema } from './gestion.js';

// Contrato: docs/02-diseno/api-rest.md §3.5 (áreas) y §1.2 (errores). El backend aún no tiene el
// CRUD de áreas: estos handlers guardan el estado en memoria. Supuesto: el cuerpo es
// `{id, nombre, correoContacto, activo}`, tomado de la entidad `Area` (la API no lo detalla).
// Se registran antes que `handlersAreas`, que queda como respaldo de solo lectura.
let areas = structuredClone(areasEjemplo);

// Áreas con usuarios activos: no se pueden desactivar (409, api-rest §3.5).
const AREAS_CON_USUARIOS = new Set([1]);

/** Restablece el estado en memoria; llamar en `beforeEach` de las pruebas que mutan. */
export function reiniciarAreas() {
  areas = structuredClone(areasEjemplo);
}

/** Área por id (o `undefined`); lo usan los handlers de categorías para el nombre del área. */
export const buscarArea = (id) => areas.find((a) => a.id === Number(id));

const ruta = (request) => new URL(request.url).pathname;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar({ nombre, correoContacto }) {
  const errores = {};
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100) {
    errores.nombre = 'El nombre es obligatorio (hasta 100 caracteres).';
  }
  if (typeof correoContacto !== 'string' || !CORREO.test(correoContacto)) {
    errores.correoContacto = 'El correo de contacto no es válido.';
  }
  return errores;
}

// 400 por campo, 409 por nombre repetido; `null` si el cuerpo es correcto.
function rechazar(cuerpo, request, idActual) {
  const errores = validar(cuerpo);
  if (Object.keys(errores).length > 0) {
    return problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', ruta(request), {
      errores,
    });
  }
  const nombre = cuerpo.nombre.trim().toLowerCase();
  if (areas.some((a) => a.id !== idActual && a.nombre.toLowerCase() === nombre)) {
    return problema(
      409,
      'conflicto',
      'Conflicto',
      'Ya existe un área con ese nombre.',
      ruta(request),
    );
  }
  return null;
}

const noEncontrada = (request) =>
  problema(404, 'no-encontrado', 'No encontrado', 'El área no existe.', ruta(request));

export const handlersAdminAreas = [
  http.get('*/api/v1/areas', ({ request }) => {
    const incluir = new URL(request.url).searchParams.get('incluirInactivos') === 'true';
    return HttpResponse.json(areas.filter((a) => incluir || a.activo));
  }),

  http.post('*/api/v1/areas', async ({ request }) => {
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, null);
    if (rechazo) return rechazo;
    const nueva = {
      id: Math.max(0, ...areas.map((a) => a.id)) + 1,
      nombre: cuerpo.nombre.trim(),
      correoContacto: cuerpo.correoContacto.trim(),
      activo: true,
    };
    areas.push(nueva);
    return HttpResponse.json(nueva, { status: 201 });
  }),

  http.put('*/api/v1/areas/:id/reactivar', ({ params, request }) => {
    const area = buscarArea(params.id);
    if (!area) return noEncontrada(request);
    area.activo = true;
    return HttpResponse.json(area);
  }),

  http.put('*/api/v1/areas/:id', async ({ params, request }) => {
    const area = buscarArea(params.id);
    if (!area) return noEncontrada(request);
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, area.id);
    if (rechazo) return rechazo;
    Object.assign(area, {
      nombre: cuerpo.nombre.trim(),
      correoContacto: cuerpo.correoContacto.trim(),
    });
    return HttpResponse.json(area);
  }),

  http.delete('*/api/v1/areas/:id', ({ params, request }) => {
    const area = buscarArea(params.id);
    if (!area) return noEncontrada(request);
    if (AREAS_CON_USUARIOS.has(area.id)) {
      return problema(
        409,
        'conflicto',
        'Conflicto',
        'No se puede desactivar un área con usuarios activos.',
        ruta(request),
      );
    }
    area.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
