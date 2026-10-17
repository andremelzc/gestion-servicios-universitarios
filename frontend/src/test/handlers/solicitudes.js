import { http, HttpResponse } from 'msw';
import { problema } from './gestion.js';

// Catálogos y alta de solicitudes (docs/02-diseno/api-rest.md §3.2 y §3.5), con las formas
// reales de CategoriaResponse/PrioridadResponse/SolicitudCreadaResponse del backend.
export const categoriasEjemplo = [
  {
    id: 2,
    nombre: 'Equipos de Cómputo',
    descripcion: 'Computadoras, proyectores y periféricos',
    idArea: 1,
    area: 'Tecnologías de la Información',
    tiempoSlaHoras: 24,
    activo: true,
  },
  {
    id: 3,
    nombre: 'Mobiliario',
    descripcion: 'Mesas, sillas y pizarras',
    idArea: 2,
    area: 'Servicios Generales',
    tiempoSlaHoras: 48,
    activo: true,
  },
];

export const prioridadesEjemplo = [
  { id: 1, nivel: 'BAJA', ponderador: 1, slaMaxHoras: 72, activo: true },
  { id: 2, nivel: 'MEDIA', ponderador: 2, slaMaxHoras: 48, activo: true },
  { id: 3, nivel: 'ALTA', ponderador: 3, slaMaxHoras: 8, activo: true },
];

export const solicitudCreadaEjemplo = {
  id: 150,
  codigo: 'SOL-2026-0150',
  titulo: 'Proyector sin imagen',
  estado: 'REGISTRADA',
  fechaRegistro: '2026-10-17T15:04:05',
  fechaLimiteSla: '2026-10-18T15:04:05',
  mensaje: 'Solicitud registrada con éxito',
};

export const handlersSolicitudes = [
  http.get('*/api/v1/categorias', () => HttpResponse.json(categoriasEjemplo)),

  http.get('*/api/v1/prioridades', () => HttpResponse.json(prioridadesEjemplo)),

  // Eco del alta: exige la parte `solicitud` (JSON) y devuelve 201 con el mismo título.
  http.post('*/api/v1/solicitudes', async ({ request }) => {
    const formulario = await request.formData();
    const parte = formulario.get('solicitud');
    if (parte == null) {
      return problema(
        400,
        'validacion',
        'Validación fallida',
        'Falta la parte "solicitud".',
        '/api/v1/solicitudes',
      );
    }
    // En jsdom/undici la parte JSON sin `filename` llega como texto; en el navegador, como Blob.
    const solicitud = JSON.parse(typeof parte === 'string' ? parte : await parte.text());
    return HttpResponse.json(
      { ...solicitudCreadaEjemplo, titulo: solicitud.titulo ?? solicitudCreadaEjemplo.titulo },
      {
        status: 201,
        headers: { Location: `/api/v1/solicitudes/${solicitudCreadaEjemplo.id}` },
      },
    );
  }),
];
