import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import { areasEjemplo } from '../../../test/handlers/areas.js';
import { useAreas } from './useAreas.js';

function responder(cuerpo) {
  server.use(http.get('*/api/v1/areas', () => HttpResponse.json(cuerpo)));
}

describe('useAreas', () => {
  it('[DASH-15] deshabilitado no pide nada y no hay error', () => {
    const { result } = renderHook(() => useAreas(false));

    expect(result.current).toEqual({ areas: [], error: false });
  });

  it('[DASH-15] acepta un arreglo de áreas', async () => {
    const { result } = renderHook(() => useAreas(true));

    await waitFor(() => expect(result.current.areas).toEqual(areasEjemplo));
    expect(result.current.error).toBe(false);
  });

  it('[DASH-15] acepta una página `{ content: [...] }`', async () => {
    responder({ content: areasEjemplo, totalElements: 2 });
    const { result } = renderHook(() => useAreas(true));

    await waitFor(() => expect(result.current.areas).toEqual(areasEjemplo));
    expect(result.current.error).toBe(false);
  });

  it.each([[{ foo: 1 }], [null], ['texto'], [{ content: 'no-arreglo' }]])(
    '[DASH-15] cualquier otra forma (%j) cuenta como error',
    async (cuerpo) => {
      responder(cuerpo);
      const { result } = renderHook(() => useAreas(true));

      await waitFor(() => expect(result.current.error).toBe(true));
      expect(result.current.areas).toEqual([]);
    },
  );

  it('[DASH-15] si la petición falla, devuelve error', async () => {
    server.use(http.get('*/api/v1/areas', () => HttpResponse.json({}, { status: 500 })));
    const { result } = renderHook(() => useAreas(true));

    await waitFor(() => expect(result.current.error).toBe(true));
  });
});
