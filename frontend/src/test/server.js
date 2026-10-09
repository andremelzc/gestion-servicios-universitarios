import { setupServer } from 'msw/node';
import { handlersGestion } from './handlers/gestion.js';

// Los handlers por recurso se agregan en cada feature (contratos de docs/02-diseno/api-rest.md).
export const handlers = [...handlersGestion];

export const server = setupServer(...handlers);
