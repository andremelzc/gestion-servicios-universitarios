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

// Resumen de las solicitudes propias (`GET /solicitudes/mis-solicitudes`, api-rest §3.2) con las
// formas reales de `SolicitudResumenResponse`: 25 filas (CA-11: primera página de 20), fechas UTC
// en orden descendente y los 6 estados fijos (ADR-009) para poder filtrar.
const NOMBRES_ESTADO = {
  REGISTRADA: 'Registrada',
  EN_EVALUACION: 'En evaluación',
  ASIGNADA: 'Asignada',
  EN_ATENCION: 'En atención',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};
const CODIGOS_ESTADO = Object.keys(NOMBRES_ESTADO);

export const misSolicitudesEjemplo = Array.from({ length: 25 }, (_, indice) => {
  const numero = 150 - indice;
  const estadoCodigo = CODIGOS_ESTADO[indice % CODIGOS_ESTADO.length];
  const fechaRegistro = new Date(Date.UTC(2026, 9, 17, 15) - indice * 3 * 60 * 60 * 1000);
  return {
    id: numero,
    codigo: `SOL-2026-0${String(numero).padStart(3, '0')}`,
    titulo: indice === 1 ? 'Wi-Fi caído en la biblioteca' : `Solicitud de ejemplo ${numero}`,
    categoriaNombre: 'Equipos de Cómputo',
    prioridadNivel: ['ALTA', 'MEDIA', 'BAJA'][indice % 3],
    estadoCodigo,
    estadoNombre: NOMBRES_ESTADO[estadoCodigo],
    tecnicoNombreCompleto: null,
    fechaRegistro: fechaRegistro.toISOString(),
    fechaLimiteSla: new Date(fechaRegistro.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    vencida: false,
  };
});

/** Responde `mis-solicitudes` como el backend: filtra por `estado` y `q` (código o título) y pagina (§2.3). */
export function responderMisSolicitudes(request) {
  const params = new URL(request.url).searchParams;
  const pagina = Number(params.get('page') ?? 0);
  const tamano = Number(params.get('size') ?? 20);
  const estado = params.get('estado');
  const consulta = (params.get('q') ?? '').trim().toLowerCase();

  let filas = misSolicitudesEjemplo;
  if (estado) filas = filas.filter((solicitud) => solicitud.estadoCodigo === estado);
  if (consulta) {
    filas = filas.filter(
      (solicitud) =>
        solicitud.codigo.toLowerCase().includes(consulta) ||
        solicitud.titulo.toLowerCase().includes(consulta),
    );
  }

  const inicio = pagina * tamano;
  return HttpResponse.json({
    content: filas.slice(inicio, inicio + tamano),
    page: pagina,
    size: tamano,
    totalElements: filas.length,
    totalPages: Math.ceil(filas.length / tamano),
  });
}

export const handlersSolicitudes = [
  http.get('*/api/v1/categorias', () => HttpResponse.json(categoriasEjemplo)),

  http.get('*/api/v1/prioridades', () => HttpResponse.json(prioridadesEjemplo)),

  http.get('*/api/v1/solicitudes/mis-solicitudes', ({ request }) =>
    responderMisSolicitudes(request),
  ),

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
