import { http, HttpResponse } from 'msw';
import { buscarArea } from './admin.areas.js';
import { problema } from './gestion.js';
import { categoriasEjemplo } from './solicitudes.js';

// Contrato: docs/02-diseno/api-rest.md §3.5 (categorías) y §1.2 (errores); cuerpo de
// `CategoriaResponse` del backend. El backend aún no tiene el CRUD de categorías: estos handlers
// guardan el estado en memoria. Se registran antes que `handlersSolicitudes`, así el
// `GET /categorias` del formulario de solicitud refleja las altas y bajas del administrador.
let categorias = structuredClone(categoriasEjemplo);

/** Restablece el estado en memoria; llamar en `beforeEach` de las pruebas que mutan. */
export function reiniciarCategorias() {
  categorias = structuredClone(categoriasEjemplo);
}

const ruta = (request) => new URL(request.url).pathname;
const entero = (valor) => Number.isInteger(valor) && valor > 0;

function validar({ nombre, descripcion, idArea, tiempoSlaHoras }) {
  const errores = {};
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 80) {
    errores.nombre = 'El nombre es obligatorio (hasta 80 caracteres).';
  }
  if ((descripcion ?? '').length > 255) errores.descripcion = 'Hasta 255 caracteres.';
  if (!entero(idArea) || !buscarArea(idArea)) errores.idArea = 'El área no existe.';
  if (!entero(tiempoSlaHoras)) errores.tiempoSlaHoras = 'El SLA debe ser mayor que 0.';
  return errores;
}

// 400 por campo, 409 por nombre repetido (unicidad); `null` si el cuerpo es correcto.
function rechazar(cuerpo, request, idActual) {
  const errores = validar(cuerpo);
  if (Object.keys(errores).length > 0) {
    return problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', ruta(request), {
      errores,
    });
  }
  const nombre = cuerpo.nombre.trim().toLowerCase();
  if (categorias.some((c) => c.id !== idActual && c.nombre.toLowerCase() === nombre)) {
    return problema(
      409,
      'conflicto',
      'Conflicto',
      'Ya existe una categoría con ese nombre.',
      ruta(request),
    );
  }
  return null;
}

const datosDe = (cuerpo) => ({
  nombre: cuerpo.nombre.trim(),
  descripcion: cuerpo.descripcion ?? null,
  idArea: cuerpo.idArea,
  area: buscarArea(cuerpo.idArea).nombre,
  tiempoSlaHoras: cuerpo.tiempoSlaHoras,
});

const noEncontrada = (request) =>
  problema(404, 'no-encontrado', 'No encontrado', 'La categoría no existe.', ruta(request));

const buscar = (params) => categorias.find((c) => c.id === Number(params.id));

export const handlersAdminCategorias = [
  http.get('*/api/v1/categorias', ({ request }) => {
    const parametros = new URL(request.url).searchParams;
    const incluir = parametros.get('incluirInactivos') === 'true';
    const idArea = parametros.get('idArea');
    return HttpResponse.json(
      categorias.filter((c) => (incluir || c.activo) && (!idArea || c.idArea === Number(idArea))),
    );
  }),

  http.post('*/api/v1/categorias', async ({ request }) => {
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, null);
    if (rechazo) return rechazo;
    const nueva = {
      id: Math.max(0, ...categorias.map((c) => c.id)) + 1,
      ...datosDe(cuerpo),
      activo: true,
    };
    categorias.push(nueva);
    return HttpResponse.json(nueva, { status: 201 });
  }),

  http.put('*/api/v1/categorias/:id/reactivar', ({ params, request }) => {
    const categoria = buscar(params);
    if (!categoria) return noEncontrada(request);
    categoria.activo = true;
    return HttpResponse.json(categoria);
  }),

  http.put('*/api/v1/categorias/:id', async ({ params, request }) => {
    const categoria = buscar(params);
    if (!categoria) return noEncontrada(request);
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, categoria.id);
    if (rechazo) return rechazo;
    Object.assign(categoria, datosDe(cuerpo));
    return HttpResponse.json(categoria);
  }),

  // Baja lógica (RN-14): la categoría sigue en las solicitudes que ya la usan.
  http.delete('*/api/v1/categorias/:id', ({ params, request }) => {
    const categoria = buscar(params);
    if (!categoria) return noEncontrada(request);
    categoria.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
