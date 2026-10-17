import { setupServer } from 'msw/node';
import { handlersDashboard } from './handlers/dashboard.js';
import { handlersGestion } from './handlers/gestion.js';
import { handlersSolicitudes } from './handlers/solicitudes.js';

// Los handlers por recurso se agregan en cada feature (contratos de docs/02-diseno/api-rest.md).
export const handlers = [...handlersGestion, ...handlersDashboard, ...handlersSolicitudes];

export const server = setupServer(...handlers);
