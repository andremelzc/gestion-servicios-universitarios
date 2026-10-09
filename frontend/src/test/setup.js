import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server.js';

// `error`: toda petición sin handler falla la prueba en lugar de salir a la red.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// jsdom no implementa ResizeObserver ni layout: `ResponsiveContainer` de Recharts
// mediría 0 px y no dibujaría nada. Este stub informa un tamaño fijo al observar.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(target) {
        this.callback([{ target, contentRect: { width: 480, height: 280 } }], this);
      }
      unobserve() {}
      disconnect() {}
    },
  );
});
afterAll(() => vi.unstubAllGlobals());
