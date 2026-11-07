import { http, HttpResponse } from 'msw';

// Contrato: docs/02-diseno/api-rest.md §3.5 (`GET /areas`, solo activas por defecto). El cuerpo
// replica la entidad `Area` del backend (id, nombre, activo); el endpoint aún no existe allí.
export const areasEjemplo = [
  {
    id: 1,
    nombre: 'Tecnología de la Información',
    correoContacto: 'ti@universidad.edu',
    activo: true,
  },
  { id: 2, nombre: 'Infraestructura', correoContacto: 'infra@universidad.edu', activo: true },
];

export const handlersAreas = [http.get('*/api/v1/areas', () => HttpResponse.json(areasEjemplo))];
