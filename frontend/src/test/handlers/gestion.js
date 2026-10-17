import { http, HttpResponse } from 'msw';

// Contratos: docs/02-diseno/api-rest.md §3.2 (asignar), §3.6 (técnicos), §1.2 y arquitectura §8 (errores).
// `cargaActual` no está definido en la API: se asume como el número de solicitudes en curso (GES-10).
export const tecnicosEjemplo = [
  { id: 14, nombre: 'Carlos', apellido: 'Ruiz', idArea: 1, activo: true, cargaActual: 3 },
  { id: 15, nombre: 'Lucía', apellido: 'Vega', idArea: 1, activo: true, cargaActual: 6 },
];

// `SolicitudDetalle` de api-rest §3.2 (`GET /solicitudes/{id}`), con la prioridad como código.
export const solicitudDetalleEjemplo = {
  id: 150,
  codigo: 'SOL-2026-0150',
  titulo: 'Proyector sin imagen',
  descripcion: 'El proyector del aula no muestra imagen.',
  ubicacionCampus: 'Campus Central',
  ubicacionAmbiente: 'Pabellón B - Aula 402',
  categoria: { id: 2, nombre: 'Equipos de Cómputo' },
  area: { id: 1, nombre: 'Tecnologías de la Información' },
  prioridad: 'ALTA',
  estado: { codigo: 'EN_EVALUACION', nombreVisible: 'En evaluación', colorHex: '#D97706' },
  solicitante: { id: 7, nombre: 'Juan', apellido: 'Pérez' },
  tecnico: null,
  informeResolucion: null,
  fechaRegistro: '2026-10-03T15:04:05Z',
  fechaLimiteSla: '2026-10-04T15:04:05Z',
  fechaResolucion: null,
  fechaCierre: null,
  vencida: false,
  evidencias: [],
  accionesPermitidas: ['ASIGNAR', 'COMENTAR'],
};

// Cuerpo `application/problem+json` (api-rest §1.2); `slug` es el sufijo del `type` (arquitectura §8).
export function problema(status, slug, title, detail, instance, extra = {}) {
  return HttpResponse.json(
    {
      type: `https://servicios.universidad.edu/problemas/${slug}`,
      title,
      status,
      detail,
      instance,
      timestamp: '2026-10-03T15:04:05Z',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      ...extra,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

// Catálogos (`GET /prioridades` entrega `nivel`; `GET /categorias`, api-rest §3.5).
export const prioridadesEjemplo = [
  { id: 2, nivel: 'MEDIA', ponderador: 2, slaMaxHoras: 48, activo: true },
  { id: 3, nivel: 'ALTA', ponderador: 3, slaMaxHoras: 24, activo: true },
];
export const categoriasEjemplo = [
  { id: 2, nombre: 'Equipos de Cómputo', idArea: 1, area: 'Tecnologías de la Información' },
];

// `SolicitudResumenResponse` real del backend: plano (estadoCodigo, prioridadNivel…).
export const resumenEjemplo = {
  id: 150,
  codigo: 'SOL-2026-0150',
  titulo: 'Proyector sin imagen',
  categoriaNombre: 'Equipos de Cómputo',
  prioridadNivel: 'ALTA',
  estadoCodigo: 'EN_EVALUACION',
  estadoNombre: 'En evaluación',
  estadoColorHex: '#D97706',
  tecnicoNombreCompleto: null,
  fechaRegistro: '2026-10-03T15:04:05',
  fechaLimiteSla: '2026-10-04T15:04:05',
  vencida: false,
};

/** Sobre `Page<T>` de api-rest §2.3. */
export const paginaDe = (content, extra = {}) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  ...extra,
});

export const handlersGestion = [
  http.get('*/api/v1/solicitudes', () => HttpResponse.json(paginaDe([resumenEjemplo]))),
  http.get('*/api/v1/prioridades', () => HttpResponse.json(prioridadesEjemplo)),
  http.get('*/api/v1/categorias', () => HttpResponse.json(categoriasEjemplo)),
  http.put('*/api/v1/solicitudes/:id/evaluar', ({ params }) =>
    HttpResponse.json({ ...solicitudDetalleEjemplo, id: Number(params.id) }),
  ),
  http.get('*/api/v1/usuarios/tecnicos', () => HttpResponse.json(tecnicosEjemplo)),

  http.put('*/api/v1/solicitudes/:id/asignar', async ({ params, request }) => {
    const instance = new URL(request.url).pathname;
    const { idTecnico } = await request.json();
    if (!idTecnico) {
      return problema(
        400,
        'validacion',
        'Validación fallida',
        'Uno o más campos no son válidos.',
        instance,
        {
          errores: { idTecnico: 'Selecciona un técnico.' },
        },
      );
    }
    const tecnico = tecnicosEjemplo.find((t) => t.id === Number(idTecnico));
    if (!tecnico) {
      return problema(
        400,
        'validacion',
        'Técnico no válido',
        'El técnico no está activo en el área de la categoría.',
        instance,
      );
    }
    return HttpResponse.json({
      ...solicitudDetalleEjemplo,
      id: Number(params.id),
      estado: { codigo: 'ASIGNADA', nombreVisible: 'Asignada', colorHex: '#2563EB' },
      tecnico: { id: tecnico.id, nombre: tecnico.nombre, apellido: tecnico.apellido },
    });
  }),
];
