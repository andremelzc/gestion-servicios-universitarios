import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server.js';

// jsdom no calcula el layout y `getClientRects()` siempre es vacío: se simula que todo elemento
// es visible salvo que él o un ancestro tenga `display: none` (la lógica real de Modal lo exige).
Element.prototype.getClientRects = function getClientRects() {
  for (let el = this; el; el = el.parentElement) {
    if (getComputedStyle(el).display === 'none') return [];
  }
  return [{}];
};

// `error`: toda petición sin handler falla la prueba en lugar de salir a la red.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
