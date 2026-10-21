import { http, HttpResponse } from 'msw';
import { problema } from './gestion.js';

// Contratos: docs/02-diseno/api-rest.md §3.5 (catálogos) y §1.2 (errores). El backend aún no tiene
// el CRUD de administración (#137): estos handlers guardan el estado en memoria.
// Supuesto: `GET /prioridades` devuelve un arreglo de `{id, nivel, ponderador, slaMaxHoras,
// activo}` (el nombre de los campos sale del modelo de datos §3.5; §3.5 de la API no los lista).
const SEMILLA_PRIORIDADES = [
  { id: 1, nivel: 'BAJA', ponderador: 1, slaMaxHoras: 72, activo: true },
  { id: 2, nivel: 'MEDIA', ponderador: 2, slaMaxHoras: 48, activo: true },
  { id: 3, nivel: 'ALTA', ponderador: 3, slaMaxHoras: 24, activo: true },
  { id: 4, nivel: 'CRITICA', ponderador: 4, slaMaxHoras: 4, activo: true },
];

// Estados (ADR-009): conjunto fijo; solo se edita la presentación. Los campos salen del modelo de
// datos §3.6 y del objeto `estado` de api-rest §3.2; el cuerpo de `GET /estados` no está documentado.
const SEMILLA_ESTADOS = [
  ['REGISTRADA', 'Registrada', 'La solicitud fue recibida.', '#6B7280'],
  ['EN_EVALUACION', 'En evaluación', 'Un supervisor revisa la solicitud.', '#D97706'],
  ['ASIGNADA', 'Asignada', 'Un técnico fue asignado.', '#2563EB'],
  ['EN_ATENCION', 'En atención', 'El técnico trabaja en la solicitud.', '#7C3AED'],
  ['RESUELTA', 'Resuelta', 'El técnico informó la resolución.', '#059669'],
  ['CERRADA', 'Cerrada', 'La solicitud terminó.', '#047857'],
].map(([codigo, nombreVisible, descripcion, colorHex], i) => ({
  codigo,
  nombreVisible,
  descripcion,
  colorHex,
  orden: i + 1,
  esFinal: codigo === 'CERRADA',
}));

let prioridades = structuredClone(SEMILLA_PRIORIDADES);
let estados = structuredClone(SEMILLA_ESTADOS);

/** Restablece el estado en memoria; llamar en `beforeEach` de las pruebas que mutan. */
export function reiniciarAdmin() {
  prioridades = structuredClone(SEMILLA_PRIORIDADES);
  estados = structuredClone(SEMILLA_ESTADOS);
}

const ruta = (request) => new URL(request.url).pathname;
const entero = (valor) => Number.isInteger(valor) && valor > 0;

function validarPrioridad({ nivel, ponderador, slaMaxHoras }) {
  const errores = {};
  if (typeof nivel !== 'string' || !nivel.trim() || nivel.length > 20) {
    errores.nivel = 'El nivel es obligatorio (hasta 20 caracteres).';
  }
  if (!entero(ponderador)) errores.ponderador = 'La urgencia debe ser un entero mayor que 0.';
  if (!entero(slaMaxHoras)) errores.slaMaxHoras = 'El SLA debe ser mayor que 0.';
  return errores;
}

// 400 por campo, 409 por nivel repetido (unicidad); `null` si el cuerpo es correcto.
function rechazarPrioridad(cuerpo, request, idActual) {
  const errores = validarPrioridad(cuerpo);
  if (Object.keys(errores).length > 0) {
    return problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', ruta(request), {
      errores,
    });
  }
  const nivel = cuerpo.nivel.trim().toUpperCase();
  if (prioridades.some((p) => p.id !== idActual && p.nivel.toUpperCase() === nivel)) {
    return problema(
      409,
      'conflicto',
      'Conflicto',
      'Ya existe una prioridad con ese nivel.',
      ruta(request),
    );
  }
  return null;
}

const noEncontrada = (request) =>
  problema(404, 'no-encontrado', 'No encontrado', 'La prioridad no existe.', ruta(request));

const buscar = (params) => prioridades.find((p) => p.id === Number(params.id));

export const handlersAdmin = [
  http.get('*/api/v1/prioridades', ({ request }) => {
    const incluir = new URL(request.url).searchParams.get('incluirInactivos') === 'true';
    return HttpResponse.json(prioridades.filter((p) => incluir || p.activo));
  }),

  http.post('*/api/v1/prioridades', async ({ request }) => {
    const cuerpo = await request.json();
    const rechazo = rechazarPrioridad(cuerpo, request, null);
    if (rechazo) return rechazo;
    const nueva = {
      id: Math.max(0, ...prioridades.map((p) => p.id)) + 1,
      nivel: cuerpo.nivel.trim(),
      ponderador: cuerpo.ponderador,
      slaMaxHoras: cuerpo.slaMaxHoras,
      activo: true,
    };
    prioridades.push(nueva);
    return HttpResponse.json(nueva, { status: 201 });
  }),

  http.put('*/api/v1/prioridades/:id/reactivar', ({ params, request }) => {
    const prioridad = buscar(params);
    if (!prioridad) return noEncontrada(request);
    prioridad.activo = true;
    return HttpResponse.json(prioridad);
  }),

  http.put('*/api/v1/prioridades/:id', async ({ params, request }) => {
    const prioridad = buscar(params);
    if (!prioridad) return noEncontrada(request);
    const cuerpo = await request.json();
    const rechazo = rechazarPrioridad(cuerpo, request, prioridad.id);
    if (rechazo) return rechazo;
    // El SLA nuevo solo rige para solicitudes nuevas (CA-6): no hay nada que recalcular aquí.
    Object.assign(prioridad, {
      nivel: cuerpo.nivel.trim(),
      ponderador: cuerpo.ponderador,
      slaMaxHoras: cuerpo.slaMaxHoras,
    });
    return HttpResponse.json(prioridad);
  }),

  http.delete('*/api/v1/prioridades/:id', ({ params, request }) => {
    const prioridad = buscar(params);
    if (!prioridad) return noEncontrada(request);
    prioridad.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/api/v1/estados', () => HttpResponse.json(estados)),

  http.put('*/api/v1/estados/:codigo', async ({ params, request }) => {
    const estado = estados.find((e) => e.codigo === params.codigo);
    if (!estado) {
      return problema(404, 'no-encontrado', 'No encontrado', 'El estado no existe.', ruta(request));
    }
    const { nombreVisible, descripcion = null, colorHex } = await request.json();
    const errores = {};
    if (typeof nombreVisible !== 'string' || !nombreVisible.trim() || nombreVisible.length > 40) {
      errores.nombreVisible = 'El nombre visible es obligatorio (hasta 40 caracteres).';
    }
    if ((descripcion ?? '').length > 255) errores.descripcion = 'Hasta 255 caracteres.';
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex ?? '')) errores.colorHex = 'Usa el formato #RRGGBB.';
    if (Object.keys(errores).length > 0) {
      return problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', ruta(request), {
        errores,
      });
    }
    // El código y las transiciones no cambian (CA-7): solo se actualiza la presentación.
    Object.assign(estado, { nombreVisible: nombreVisible.trim(), descripcion, colorHex });
    return HttpResponse.json(estado);
  }),

  // El conjunto de estados es fijo: no hay POST ni DELETE (api-rest §3.5; CA-7 admite 405/404).
  http.post('*/api/v1/estados', ({ request }) =>
    problema(
      405,
      'metodo-no-permitido',
      'Método no permitido',
      'No se crean estados.',
      ruta(request),
    ),
  ),
  http.delete('*/api/v1/estados/:codigo', ({ request }) =>
    problema(
      405,
      'metodo-no-permitido',
      'Método no permitido',
      'No se borran estados.',
      ruta(request),
    ),
  ),
];
