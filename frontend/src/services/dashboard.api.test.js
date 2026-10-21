import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server.js';
import { dashboardApi, construirConsulta } from './dashboard.api.js';

// Captura la URL de la petición para comprobar la ruta y los parámetros enviados.
function capturar(ruta, cuerpo = []) {
  const capturas = [];
  server.use(
    http.get(`*/api/v1/dashboard/${ruta}`, ({ request }) => {
      capturas.push(new URL(request.url));
      return HttpResponse.json(cuerpo);
    }),
  );
  return capturas;
}

describe('construirConsulta (API §3.4)', () => {
  it('[US-12 CA-2] sin filtros no agrega query string', () => {
    expect(construirConsulta()).toBe('');
    expect(construirConsulta({})).toBe('');
  });

  it('[US-12 CA-2] incluye desde, hasta e idArea y omite vacíos, null y undefined', () => {
    expect(construirConsulta({ desde: '2026-10-01', hasta: '2026-10-03', idArea: 2 })).toBe(
      '?desde=2026-10-01&hasta=2026-10-03&idArea=2',
    );
    expect(construirConsulta({ desde: '', hasta: null, idArea: undefined })).toBe('');
    expect(construirConsulta({ hasta: '2026-10-03' })).toBe('?hasta=2026-10-03');
  });

  it('[US-12 CA-2] ignora parámetros que el contrato no define', () => {
    expect(construirConsulta({ desde: '2026-10-01', otro: 'x' })).toBe('?desde=2026-10-01');
  });
});

describe('dashboardApi (API §3.4)', () => {
  it.each([
    ['kpis', 'kpis'],
    ['porCategoria', 'por-categoria'],
    ['porPrioridad', 'por-prioridad'],
    ['porEstado', 'por-estado'],
    ['porResponsable', 'por-responsable'],
  ])('[US-12 CA-2] %s pide /dashboard/%s con los filtros como query', async (metodo, ruta) => {
    const capturas = capturar(ruta, { ok: true });

    const datos = await dashboardApi[metodo]({ desde: '2026-10-01', hasta: '2026-10-03' });

    expect(datos).toEqual({ ok: true });
    expect(capturas).toHaveLength(1);
    expect(capturas[0].searchParams.get('desde')).toBe('2026-10-01');
    expect(capturas[0].searchParams.get('hasta')).toBe('2026-10-03');
    expect(capturas[0].searchParams.has('idArea')).toBe(false);
  });

  it('[US-12 CA-4] envía idArea cuando se indica (solo lo respeta el backend para ADMIN)', async () => {
    const capturas = capturar('kpis');

    await dashboardApi.kpis({ idArea: 3 });

    expect(capturas[0].searchParams.get('idArea')).toBe('3');
    expect(capturas[0].searchParams.has('desde')).toBe(false);
  });

  it('[US-12 CA-2] cancela la petición con la señal recibida', async () => {
    capturar('por-estado');
    const controlador = new AbortController();

    const promesa = dashboardApi.porEstado({}, { signal: controlador.signal });
    controlador.abort();

    await expect(promesa).rejects.toMatchObject({ status: 0, sinConexion: true });
  });

  it('[US-12 CA-10] propaga el error normalizado (RFC 7807) del apiClient', async () => {
    server.use(
      http.get('*/api/v1/dashboard/kpis', () =>
        HttpResponse.json(
          { type: 'https://servicios.universidad.edu/problemas/acceso', status: 403 },
          { status: 403 },
        ),
      ),
    );

    await expect(dashboardApi.kpis()).rejects.toMatchObject({ status: 403 });
  });
});
