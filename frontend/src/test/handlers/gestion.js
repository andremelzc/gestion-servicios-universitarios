import { http, HttpResponse } from 'msw';

// Contratos: docs/02-diseno/api-rest.md §3.2 (asignar), §3.6 (técnicos) y §1.2 (errores RFC 7807).
// `cargaActual` no está definido en la API: se asume como el número de solicitudes en curso (GES-10).
export const tecnicosEjemplo = [
  { id: 14, nombre: 'Carlos', apellido: 'Ruiz', idArea: 1, activo: true, cargaActual: 3 },
  { id: 15, nombre: 'Lucía', apellido: 'Vega', idArea: 1, activo: true, cargaActual: 6 },
];

export function problema(status, title, detail, extra = {}) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title,
      status,
      detail,
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
    const { idTecnico } = await request.json();
    if (!idTecnico) {
      return problema(400, 'Solicitud inválida', 'Hay campos con errores.', {
        errores: { idTecnico: 'Selecciona un técnico.' },
      });
    }
    const tecnico = tecnicosEjemplo.find((t) => t.id === idTecnico);
    if (!tecnico) {
      return problema(
        400,
        'Técnico no válido',
        'El técnico no está activo en el área de la categoría.',
      );
    }
    return HttpResponse.json({
      id: Number(params.id),
      estado: { codigo: 'ASIGNADA', nombreVisible: 'Asignada', colorHex: '#2563EB' },
      tecnico: { id: tecnico.id, nombre: tecnico.nombre, apellido: tecnico.apellido },
    });
  }),
];
