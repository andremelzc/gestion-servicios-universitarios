import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDashboardWidget } from './useDashboardWidget.js';

// Promesa que se resuelve o rechaza a demanda, para controlar el orden de las respuestas.
function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

describe('useDashboardWidget', () => {
  it('[US-12 CA-11] empieza cargando y pasa a ok con los datos', async () => {
    const cargar = vi.fn().mockResolvedValue([{ nombre: 'A', valor: 1 }]);

    const { result } = renderHook(() => useDashboardWidget(cargar, {}));

    expect(result.current.estado).toBe('cargando');
    await waitFor(() => expect(result.current.estado).toBe('ok'));
    expect(result.current.datos).toEqual([{ nombre: 'A', valor: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it('[US-12 CA-11] llama a cargar con los filtros y una señal de cancelación', async () => {
    const cargar = vi.fn().mockResolvedValue([]);

    renderHook(() => useDashboardWidget(cargar, { desde: '2026-10-01', hasta: '2026-10-03' }));

    await waitFor(() => expect(cargar).toHaveBeenCalledTimes(1));
    const [filtros, opciones] = cargar.mock.calls[0];
    expect(filtros).toEqual({ desde: '2026-10-01', hasta: '2026-10-03', idArea: undefined });
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  it('[US-12 CA-10] ante un rechazo expone estado error y el error normalizado', async () => {
    const fallo = { status: 500, detail: null, errores: {}, traceId: 'abc' };
    const cargar = vi.fn().mockRejectedValue(fallo);

    const { result } = renderHook(() => useDashboardWidget(cargar, {}));

    await waitFor(() => expect(result.current.estado).toBe('error'));
    expect(result.current.error).toBe(fallo);
    expect(result.current.datos).toBeNull();
  });

  it('[US-12 CA-10] reintentar vuelve a cargar y se recupera del error', async () => {
    const cargar = vi
      .fn()
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce([{ nombre: 'A', valor: 2 }]);
    const { result } = renderHook(() => useDashboardWidget(cargar, {}));
    await waitFor(() => expect(result.current.estado).toBe('error'));

    act(() => result.current.reintentar());

    expect(result.current.estado).toBe('cargando');
    await waitFor(() => expect(result.current.estado).toBe('ok'));
    expect(result.current.datos).toEqual([{ nombre: 'A', valor: 2 }]);
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('[US-12 CA-2] al cambiar los filtros vuelve a cargar y cancela la petición anterior', async () => {
    const cargar = vi.fn().mockResolvedValue([]);
    const { result, rerender } = renderHook(({ filtros }) => useDashboardWidget(cargar, filtros), {
      initialProps: { filtros: { desde: '2026-10-01' } },
    });
    await waitFor(() => expect(result.current.estado).toBe('ok'));
    const primeraSenal = cargar.mock.calls[0][1].signal;

    rerender({ filtros: { desde: '2026-10-02' } });

    expect(primeraSenal.aborted).toBe(true);
    expect(result.current.estado).toBe('cargando');
    await waitFor(() => expect(result.current.estado).toBe('ok'));
    expect(cargar).toHaveBeenCalledTimes(2);
    expect(cargar.mock.calls[1][0].desde).toBe('2026-10-02');
  });

  it('[US-12 CA-2] no recarga si los filtros cambian de referencia pero no de valor', async () => {
    const cargar = vi.fn().mockResolvedValue([]);
    const { result, rerender } = renderHook(({ filtros }) => useDashboardWidget(cargar, filtros), {
      initialProps: { filtros: { desde: '2026-10-01' } },
    });
    await waitFor(() => expect(result.current.estado).toBe('ok'));

    rerender({ filtros: { desde: '2026-10-01' } });

    expect(result.current.estado).toBe('ok');
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('[US-12 CA-2] descarta la respuesta tardía de una petición obsoleta', async () => {
    const vieja = diferida();
    const nueva = diferida();
    const cargar = vi.fn().mockReturnValueOnce(vieja.promesa).mockReturnValueOnce(nueva.promesa);
    const { result, rerender } = renderHook(({ filtros }) => useDashboardWidget(cargar, filtros), {
      initialProps: { filtros: { desde: '2026-10-01' } },
    });

    rerender({ filtros: { desde: '2026-10-02' } });
    await act(async () => {
      nueva.resolver([{ nombre: 'nueva', valor: 1 }]);
    });
    await act(async () => {
      vieja.resolver([{ nombre: 'vieja', valor: 9 }]);
    });

    expect(result.current.estado).toBe('ok');
    expect(result.current.datos).toEqual([{ nombre: 'nueva', valor: 1 }]);
  });

  it('[US-12 CA-10] un rechazo por cancelación no se muestra como error', async () => {
    const vieja = diferida();
    const cargar = vi.fn().mockReturnValueOnce(vieja.promesa).mockResolvedValue([]);
    const { result, rerender } = renderHook(({ filtros }) => useDashboardWidget(cargar, filtros), {
      initialProps: { filtros: { desde: '2026-10-01' } },
    });

    rerender({ filtros: { desde: '2026-10-02' } });
    await act(async () => {
      vieja.rechazar({ status: 0, sinConexion: true });
    });
    await waitFor(() => expect(result.current.estado).toBe('ok'));

    expect(result.current.error).toBeNull();
  });

  it('[US-12 CA-10] cancela la petición al desmontar', async () => {
    const pendiente = diferida();
    const cargar = vi.fn().mockReturnValue(pendiente.promesa);
    const { unmount } = renderHook(() => useDashboardWidget(cargar, {}));
    await waitFor(() => expect(cargar).toHaveBeenCalled());
    const senal = cargar.mock.calls[0][1].signal;

    unmount();

    expect(senal.aborted).toBe(true);
  });
});
