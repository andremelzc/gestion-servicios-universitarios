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

export const handlersGestion = [
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

  // `multipart/form-data` (api-rest §3.2): parte `datos` (JSON `{informe}`, ≥ 20) y parte `archivos` (1–3).
  http.put('*/api/v1/solicitudes/:id/resolver', async ({ params, request }) => {
    const instance = new URL(request.url).pathname;
    const formulario = await request.formData();
    const datos = formulario.get('datos');
    const texto = typeof datos === 'string' ? datos : await datos?.text();
    const { informe = '' } = texto ? JSON.parse(texto) : {};
    const archivos = formulario.getAll('archivos');
    const errores = {};
    if (informe.trim().length < 20) {
      errores.informe = 'El informe de resolución debe contener al menos 20 caracteres.';
    }
    if (archivos.length < 1 || archivos.length > 3) {
      errores.archivos = 'Adjunta entre 1 y 3 evidencias de la solución.';
    }
    if (Object.keys(errores).length > 0) {
      return problema(
        400,
        'validacion',
        'Validación fallida',
        'Uno o más campos no son válidos.',
        instance,
        { errores },
      );
    }
    return HttpResponse.json({
      ...solicitudDetalleEjemplo,
      id: Number(params.id),
      estado: { codigo: 'RESUELTA', nombreVisible: 'Resuelta', colorHex: '#16A34A' },
      informeResolucion: informe.trim(),
      fechaResolucion: '2026-10-04T10:00:00Z',
    });
  }),
];
