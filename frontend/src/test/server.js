import { setupServer } from 'msw/node';
import { handlersAdmin } from './handlers/admin.js';
import { handlersDashboard } from './handlers/dashboard.js';
import { handlersGestion } from './handlers/gestion.js';

// Los handlers por recurso se agregan en cada feature (contratos de docs/02-diseno/api-rest.md).
export const handlers = [...handlersGestion, ...handlersDashboard, ...handlersAdmin];

export const server = setupServer(...handlers);
