import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server.js';
import { areasApi } from './areas.api.js';

describe('areasApi (API §3.5)', () => {
  it('[DASH-15] listar pide GET /areas y devuelve el arreglo de áreas', async () => {
    const capturas = [];
    server.use(
      http.get('*/api/v1/areas', ({ request }) => {
        capturas.push(new URL(request.url));
        return HttpResponse.json([{ id: 1, nombre: 'TI', activo: true }]);
      }),
    );

    const areas = await areasApi.listar();

    expect(capturas).toHaveLength(1);
    expect(capturas[0].search).toBe('');
    expect(areas).toEqual([{ id: 1, nombre: 'TI', activo: true }]);
  });
});
