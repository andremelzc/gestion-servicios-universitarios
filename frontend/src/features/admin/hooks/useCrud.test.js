import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/apiClient.js';
import { server } from '../../../test/server.js';
import useCrud from './useCrud.js';

const BASE = '*/api/v1';

// Sobre paginado de api-rest §2.3 (página base 0).
function sobre(content, { page = 0, totalPages = 3 } = {}) {
  return { content, page, size: 20, totalElements: 50, totalPages };
}

// Registra las consultas GET recibidas y responde con la página pedida.
function simularListado(ruta = '/categorias') {
  const consultas = [];
  server.use(
    http.get(`${BASE}${ruta}`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      consultas.push(Object.fromEntries(params));
      const page = Number(params.get('page'));
      return HttpResponse.json(sobre([{ id: page + 1, nombre: `Fila ${page}` }], { page }));
    }),
  );
  return consultas;
}

// Puerta para retener una respuesta hasta que la prueba decida soltarla.
function crearPuerta() {
  let abrir;
  const abierta = new Promise((resolver) => {
    abrir = resolver;
  });
  return { abierta, abrir };
}

const montar = (opciones, ruta = '/categorias') => renderHook(() => useCrud(ruta, opciones));
const cargado = (result) => waitFor(() => expect(result.current.isLoading).toBe(false));
const avanzar = (ms) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

afterEach(() => vi.restoreAllMocks());

describe('useCrud · listado', () => {
  it('carga la primera página (page=0, size=20) y expone el sobre paginado', async () => {
    const consultas = simularListado();
    const { result } = montar();

    expect(result.current.isLoading).toBe(true);
    await cargado(result);

    expect(consultas).toEqual([{ page: '0', size: '20' }]);
    expect(result.current.data).toEqual([{ id: 1, nombre: 'Fila 0' }]);
    expect(result.current.page).toEqual({ page: 0, size: 20, totalElements: 50, totalPages: 3 });
    expect(result.current.error).toBeNull();
  });

  it('onPageChange pide la página indicada y conserva la anterior mientras carga', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);

    act(() => result.current.onPageChange(1));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([{ id: 1, nombre: 'Fila 0' }]);
    expect(result.current.page.page).toBe(0);

    await cargado(result);
    expect(consultas.at(-1)).toMatchObject({ page: '1' });
    expect(result.current.page.page).toBe(1);
  });

  it('includeInactive envía incluirInactivos=true y vuelve a la página 0', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(1));
    await waitFor(() => expect(result.current.page.page).toBe(1));

    act(() => result.current.onIncludeInactiveChange(true));
    expect(result.current.includeInactive).toBe(true);
    await cargado(result);

    expect(consultas.at(-1)).toMatchObject({ page: '0', incluirInactivos: 'true' });
  });

  it('paramInactivos como función traduce el filtro (p. ej. /admin/usuarios con activo)', async () => {
    const consultas = simularListado('/admin/usuarios');
    const paramInactivos = (incluir) => (incluir ? {} : { activo: true });
    const { result } = montar({ paramInactivos }, '/admin/usuarios');
    await cargado(result);
    expect(consultas[0]).toEqual({ page: '0', size: '20', activo: 'true' });

    act(() => result.current.onIncludeInactiveChange(true));
    await cargado(result);
    expect(consultas.at(-1)).toEqual({ page: '0', size: '20' });
  });

  it('añade los filtros propios de la pantalla y omite los vacíos', async () => {
    const consultas = simularListado();
    const { result } = montar({ filtros: { idArea: 3, rol: undefined, activo: '' } });
    await cargado(result);

    expect(consultas[0]).toEqual({ page: '0', size: '20', idArea: '3' });
  });

  it('un cambio de filtros vuelve a la página 0; el mismo valor serializado no', async () => {
    const consultas = simularListado();
    const { result, rerender } = renderHook(({ filtros }) => useCrud('/categorias', { filtros }), {
      initialProps: { filtros: { idArea: 1 } },
    });
    await cargado(result);
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(result.current.page.page).toBe(2));

    rerender({ filtros: { idArea: 1 } }); // objeto nuevo, mismo contenido
    expect(result.current.page.page).toBe(2);
    expect(consultas).toHaveLength(2);

    rerender({ filtros: { idArea: 2 } });
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ page: '0', idArea: '2' }));
    await cargado(result);
    expect(result.current.page.page).toBe(0);
  });

  it('un cambio de ruta reinicia página, búsqueda e inactivos', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const categorias = simularListado('/categorias');
    const areas = simularListado('/areas');
    const { result, rerender } = renderHook(({ ruta }) => useCrud(ruta), {
      initialProps: { ruta: '/categorias' },
    });
    await cargado(result);
    act(() => result.current.onIncludeInactiveChange(true));
    act(() => result.current.onPageChange(2));
    act(() => result.current.onSearchChange('wifi'));
    avanzar(300);
    await waitFor(() => expect(result.current.appliedSearch).toBe('wifi'));

    rerender({ ruta: '/areas' });
    expect(result.current.search).toBe('');
    expect(result.current.appliedSearch).toBe('');
    expect(result.current.includeInactive).toBe(false);
    await waitFor(() => expect(areas).toHaveLength(1));
    expect(areas[0]).toEqual({ page: '0', size: '20' });
    expect(categorias.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('si la página pedida quedó vacía retrocede a la última con datos', async () => {
    const consultas = [];
    server.use(
      http.get(`${BASE}/categorias`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        consultas.push(page);
        return HttpResponse.json(
          page >= 2
            ? sobre([], { page, totalPages: 2 })
            : sobre([{ id: page }], { page, totalPages: 2 }),
        );
      }),
    );
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(2));

    await waitFor(() => expect(result.current.page.page).toBe(1));
    await cargado(result);
    expect(consultas).toEqual([0, 2, 1]);
    expect(result.current.data).toEqual([{ id: 1 }]);
  });
});

describe('useCrud · búsqueda con debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  it('aplica el último valor una sola vez, pasado el tiempo de espera', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);

    act(() => result.current.onSearchChange('a'));
    act(() => result.current.onSearchChange('ab'));
    act(() => result.current.onSearchChange('abc'));
    expect(result.current.search).toBe('abc');
    avanzar(299);
    expect(result.current.appliedSearch).toBe('');
    avanzar(1);
    expect(result.current.appliedSearch).toBe('abc');

    await cargado(result);
    expect(consultas).toHaveLength(2);
    expect(consultas[1]).toEqual({ page: '0', size: '20', q: 'abc' });
  });

  it('al buscar vuelve a la página 0', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(result.current.page.page).toBe(2));

    act(() => result.current.onSearchChange('wifi'));
    avanzar(300);
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ page: '0', q: 'wifi' }));
  });

  it('recorta el texto, omite el parámetro si queda en blanco y respeta paramBusqueda', async () => {
    const consultas = simularListado();
    const { result } = montar({ paramBusqueda: 'texto' });
    await cargado(result);

    act(() => result.current.onSearchChange('  red  '));
    avanzar(300);
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ texto: 'red' }));
    await cargado(result);

    act(() => result.current.onSearchChange('   '));
    avanzar(300);
    await waitFor(() => expect(consultas.at(-1)).toEqual({ page: '0', size: '20' }));
  });

  it('si la búsqueda aplicada no cambia, no reinicia la página ni consulta de nuevo', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(1));
    await waitFor(() => expect(result.current.page.page).toBe(1));
    expect(consultas).toHaveLength(2);

    act(() => result.current.onSearchChange('   ')); // recortada: sigue siendo ''
    avanzar(300);
    expect(result.current.page.page).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(consultas).toHaveLength(2);
  });

  it('no aplica nada si se desmonta antes de que venza el debounce', async () => {
    const consultas = simularListado();
    const { result, unmount } = montar();
    await cargado(result);

    act(() => result.current.onSearchChange('x'));
    unmount();
    avanzar(1000);
    expect(vi.getTimerCount()).toBe(0);
    expect(consultas).toHaveLength(1);
  });
});

describe('useCrud · errores, refresco y carreras', () => {
  it('expone el error normalizado, vacía página y datos, y onRetry vuelve a cargar', async () => {
    let falla = true;
    server.use(
      http.get(`${BASE}/categorias`, () =>
        falla
          ? HttpResponse.json({ status: 500, detail: 'Fallo', traceId: 'abc' }, { status: 500 })
          : HttpResponse.json(sobre([{ id: 9 }])),
      ),
    );
    const { result } = montar();
    await cargado(result);
    expect(result.current.error).toMatchObject({ status: 500, traceId: 'abc' });
    expect(result.current.data).toEqual([]);
    expect(result.current.page).toBeNull();

    falla = false;
    act(() => result.current.onRetry());
    expect(result.current.isLoading).toBe(true);
    await cargado(result);
    expect(result.current.data).toEqual([{ id: 9 }]);
    expect(result.current.error).toBeNull();
  });

  it('refetch de la misma consulta no muestra el esqueleto: isRefreshing y datos visibles', async () => {
    const consultas = simularListado();
    const { result } = montar();
    await cargado(result);

    act(() => result.current.refetch());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.data).toEqual([{ id: 1, nombre: 'Fila 0' }]);

    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    expect(consultas).toHaveLength(2);
  });

  it('descarta la respuesta tardía de una consulta reemplazada aunque la red no la cancele', async () => {
    // Se simula `apiClient.get` ignorando `signal`: aísla la guarda del hook de la cancelación.
    const pendientes = {};
    vi.spyOn(apiClient, 'get').mockImplementation((url) => {
      const page = new URL(url, 'http://x').searchParams.get('page');
      return new Promise((resolver) => {
        pendientes[page] = () => resolver(sobre([{ id: Number(page) }], { page: Number(page) }));
      });
    });
    const { result } = montar();
    await waitFor(() => expect(pendientes[0]).toBeDefined());
    act(() => pendientes[0]());
    await cargado(result);

    act(() => result.current.onPageChange(1));
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(pendientes[2]).toBeDefined());
    await act(async () => pendientes[2]());
    expect(result.current.data).toEqual([{ id: 2 }]);

    await act(async () => pendientes[1]()); // llega tarde
    expect(result.current.data).toEqual([{ id: 2 }]);
    expect(result.current.page.page).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('cancela la petición en vuelo al desmontar', async () => {
    const puerta = crearPuerta();
    const abortar = vi.spyOn(AbortController.prototype, 'abort');
    server.use(
      http.get(`${BASE}/categorias`, async () => {
        await puerta.abierta;
        return HttpResponse.json(sobre([]));
      }),
    );
    const { unmount } = montar();
    unmount();
    expect(abortar).toHaveBeenCalled();
    puerta.abrir();
  });
});
