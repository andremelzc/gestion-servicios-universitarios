import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from './server.js';

describe('MSW', () => {
  it('[BASE-04 CA-5] el servidor MSW intercepta peticiones con handlers en runtime', async () => {
    server.use(http.get('http://localhost/api/v1/ping', () => HttpResponse.json({ ok: true })));

    const response = await fetch('http://localhost/api/v1/ping');

    expect(await response.json()).toEqual({ ok: true });
  });

  it('[BASE-04 CA-5] rechaza peticiones sin handler (onUnhandledRequest: error)', async () => {
    await expect(fetch('http://localhost/api/v1/sin-handler')).rejects.toThrow();
  });
});
