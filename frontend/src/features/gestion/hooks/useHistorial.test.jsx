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
