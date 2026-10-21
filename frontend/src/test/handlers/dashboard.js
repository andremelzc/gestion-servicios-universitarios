import { http, HttpResponse } from 'msw';

// Contrato: docs/02-diseno/api-rest.md §3.4 y `KpisResponse`/`SerieItem`/`SerieEstadoItem` del backend.
export const kpisEjemplo = {
  desde: '2026-09-03T00:00:00Z',
  hasta: '2026-10-03T23:59:59Z',
  registradas: 150,
  pendientes: 45,
  atendidas: 98,
  porcentajeResueltas: 70.5,
  mttrHoras: 24.5,
  vencidas: 7,
};

export const porCategoriaEjemplo = [
  { nombre: 'Redes y Wi-Fi', valor: 30 },
  { nombre: 'Equipos de Cómputo', valor: 22 },
  { nombre: 'Mobiliario', valor: 8 },
];

// Incluye prioridades sin solicitudes (valor 0), como el backend.
export const porPrioridadEjemplo = [
  { nombre: 'CRITICA', valor: 3 },
  { nombre: 'ALTA', valor: 12 },
  { nombre: 'MEDIA', valor: 20 },
  { nombre: 'BAJA', valor: 0 },
];

export const porEstadoEjemplo = [
  { nombre: 'REGISTRADA', valor: 14, colorHex: '#6B7280' },
  { nombre: 'EN_EVALUACION', valor: 22, colorHex: '#D97706' },
  { nombre: 'ASIGNADA', valor: 9, colorHex: '#2563EB' },
  { nombre: 'EN_ATENCION', valor: 5, colorHex: '#7C3AED' },
  { nombre: 'RESUELTA', valor: 30, colorHex: '#059669' },
  { nombre: 'CERRADA', valor: 70, colorHex: '#047857' },
];

export const porResponsableEjemplo = [
  { nombre: 'Carlos Ruiz', valor: 18 },
  { nombre: 'Lucía Vega', valor: 11 },
];

// Los filtros (`desde`, `hasta`, `idArea`) no cambian las cifras: las pruebas que necesiten
// verificarlos capturan la URL con `server.use` en lugar de simular el filtrado.
export const handlersDashboard = [
  http.get('*/api/v1/dashboard/kpis', () => HttpResponse.json(kpisEjemplo)),
  http.get('*/api/v1/dashboard/por-categoria', () => HttpResponse.json(porCategoriaEjemplo)),
  http.get('*/api/v1/dashboard/por-prioridad', () => HttpResponse.json(porPrioridadEjemplo)),
  http.get('*/api/v1/dashboard/por-estado', () => HttpResponse.json(porEstadoEjemplo)),
  http.get('*/api/v1/dashboard/por-responsable', () => HttpResponse.json(porResponsableEjemplo)),
];
