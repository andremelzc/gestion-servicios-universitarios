import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import useHistorial from './useHistorial.js';

const evento = (estadoNuevo) => ({
  fecha: '2026-10-03T15:04:05Z',
  usuario: 'Juan Pérez',
  estadoAnterior: null,
  estadoNuevo,
  nota: null,
});

describe('useHistorial', () => {
  it('carga el historial de la solicitud', async () => {
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', () =>
        HttpResponse.json([evento('REGISTRADA')]),
      ),
    );
    const { result } = renderHook(() => useHistorial(150));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('expone el error normalizado y vuelve a pedir con refetch', async () => {
    let llamadas = 0;
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', () => {
        llamadas += 1;
        return llamadas === 1
          ? HttpResponse.json({ status: 500 }, { status: 500 })
          : HttpResponse.json([evento('REGISTRADA')]);
      }),
    );
    const { result } = renderHook(() => useHistorial(150));
    await waitFor(() => expect(result.current.error?.status).toBe(500));
    expect(result.current.data).toEqual([]);
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  it('vuelve a consultar cuando cambia la solicitud', async () => {
    const ids = [];
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', ({ params }) => {
        ids.push(params.id);
        return HttpResponse.json([]);
      }),
    );
    const { rerender } = renderHook(({ id }) => useHistorial(id), { initialProps: { id: 1 } });
    await waitFor(() => expect(ids).toEqual(['1']));
    rerender({ id: 2 });
    await waitFor(() => expect(ids).toEqual(['1', '2']));
  });
});

// Promesa que se resuelve a demanda, para controlar el orden de las respuestas.
function diferida() {
  let resolver;
  const promesa = new Promise((res) => {
    resolver = res;
  });
  return { promesa, resolver };
}

describe('useHistorial: refresco y cancelación', () => {
  it('con la misma solicitud, refetch conserva la lista visible en vez de volver al esqueleto', async () => {
    const segunda = diferida();
    let llamadas = 0;
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', async () => {
        llamadas += 1;
        if (llamadas === 2) return HttpResponse.json(await segunda.promesa);
        return HttpResponse.json([evento('REGISTRADA')]);
      }),
    );
    const { result } = renderHook(() => useHistorial(150));
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    act(() => result.current.refetch());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.data).toHaveLength(1);

    segunda.resolver([evento('REGISTRADA'), evento('ASIGNADA')]);
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('al cambiar de solicitud vuelve al estado de carga y no muestra la lista anterior', async () => {
    const segunda = diferida();
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', async ({ params }) =>
        params.id === '1'
          ? HttpResponse.json([evento('REGISTRADA')])
          : HttpResponse.json(await segunda.promesa),
      ),
    );
    const { result, rerender } = renderHook(({ id }) => useHistorial(id), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    rerender({ id: 2 });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    segunda.resolver([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('pasa una señal de cancelación y la aborta al cambiar de solicitud y al desmontar', async () => {
    const senales = [];
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', ({ request }) => {
        senales.push(request.signal);
        return new Promise(() => {});
      }),
    );
    const { rerender, unmount } = renderHook(({ id }) => useHistorial(id), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(senales).toHaveLength(1));
    rerender({ id: 2 });
    await waitFor(() => expect(senales).toHaveLength(2));
    await waitFor(() => expect(senales[0].aborted).toBe(true));
    expect(senales[1].aborted).toBe(false);
    unmount();
    await waitFor(() => expect(senales[1].aborted).toBe(true));
  });

  it('una respuesta tardía de la solicitud anterior no se pinta en la nueva', async () => {
    const vieja = diferida();
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', async ({ params }) =>
        params.id === '1'
          ? HttpResponse.json(await vieja.promesa)
          : HttpResponse.json([evento('CERRADA')]),
      ),
    );
    const { result, rerender } = renderHook(({ id }) => useHistorial(id), {
      initialProps: { id: 1 },
    });
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    vieja.resolver([evento('REGISTRADA'), evento('ASIGNADA')]);
    await new Promise((r) => setTimeout(r, 30));

    expect(result.current.data).toEqual([evento('CERRADA')]);
  });
});
