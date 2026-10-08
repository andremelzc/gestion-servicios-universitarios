import { setupServer } from 'msw/node';

// Los handlers por recurso se agregan en cada feature (contratos de docs/02-diseno/api-rest.md).
export const handlers = [];

export const server = setupServer(...handlers);
