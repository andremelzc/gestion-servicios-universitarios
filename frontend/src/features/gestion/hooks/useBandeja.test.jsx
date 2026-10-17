import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import useBandeja from './useBandeja.js';

const sobre = (content) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

describe('useBandeja', () => {
  it('carga la página y expone el sobre paginado', async () => {
    server.use(http.get('*/api/v1/solicitudes', () => HttpResponse.json(sobre([{ id: 1 }]))));
    const { result } = renderHook(() => useBandeja({ estados: ['ASIGNADA'] }));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.page.totalElements).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('expone el error normalizado', async () => {
    server.use(
      http.get('*/api/v1/solicitudes', () => HttpResponse.json({ status: 403 }, { status: 403 })),
    );
    const { result } = renderHook(() => useBandeja({}));
    await waitFor(() => expect(result.current.error?.status).toBe(403));
    expect(result.current.data).toEqual([]);
  });

  it('vuelve a consultar al cambiar los filtros y con refetch', async () => {
    const consultas = [];
    server.use(
      http.get('*/api/v1/solicitudes', ({ request }) => {
        consultas.push(new URL(request.url).search);
        return HttpResponse.json(sobre([]));
      }),
    );
    const { result, rerender } = renderHook(({ filtros }) => useBandeja(filtros), {
      initialProps: { filtros: { page: 0 } },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ filtros: { page: 1 } });
    await waitFor(() => expect(consultas).toHaveLength(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.refetch());
    await waitFor(() => expect(consultas).toHaveLength(3));
    expect(consultas[1]).toContain('page=1');
  });

  it('ignora la respuesta de una consulta que ya fue reemplazada', async () => {
    server.use(
      http.get('*/api/v1/solicitudes', async ({ request }) => {
        const pagina = new URL(request.url).searchParams.get('page');
        if (pagina === '0') await new Promise((r) => setTimeout(r, 80));
        return HttpResponse.json(sobre([{ id: Number(pagina) }]));
      }),
    );
    const { result, rerender } = renderHook(({ filtros }) => useBandeja(filtros), {
      initialProps: { filtros: { page: 0 } },
    });
    rerender({ filtros: { page: 1 } });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));
    await new Promise((r) => setTimeout(r, 150));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('en un refetch de la misma consulta conserva los datos visibles hasta tener los nuevos', async () => {
    let llamadas = 0;
    server.use(
      http.get('*/api/v1/solicitudes', async () => {
        llamadas += 1;
        if (llamadas > 1) await new Promise((r) => setTimeout(r, 40));
        return HttpResponse.json(sobre([{ id: llamadas }]));
      }),
    );
    const { result } = renderHook(() => useBandeja({}));
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));

    act(() => result.current.refetch());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.data).toEqual([{ id: 1 }]);

    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
    expect(result.current.isRefreshing).toBe(false);
  });
});
