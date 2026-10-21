import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server.js';
import useCrud from './useCrud.js';

const BASE = '*/api/v1';

const sobre = (content, { page = 0, totalPages = 3 } = {}) => ({
  content,
  page,
  size: 20,
  totalElements: 50,
  totalPages,
});

// Registra los GET del listado y responde con la página pedida.
function simularListado() {
  const consultas = [];
  server.use(
    http.get(`${BASE}/categorias`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      consultas.push(Object.fromEntries(params));
      const page = Number(params.get('page'));
      return HttpResponse.json(sobre([{ id: page + 1 }], { page }));
    }),
  );
  return consultas;
}

function crearPuerta() {
  let abrir;
  const abierta = new Promise((resolver) => {
    abrir = resolver;
  });
  return { abierta, abrir };
}

const montar = () => renderHook(() => useCrud('/categorias'));
const cargado = (result) => waitFor(() => expect(result.current.isLoading).toBe(false));
const sinRefresco = (result) => waitFor(() => expect(result.current.isRefreshing).toBe(false));

afterEach(() => vi.restoreAllMocks());

describe('useCrud · mutaciones', () => {
  const casos = [
    ['crear', 'post', '/categorias', (c) => c.crear({ nombre: 'Wi-Fi' }), 201],
    ['actualizar', 'put', '/categorias/5', (c) => c.actualizar(5, { nombre: 'N' }), 200],
    ['desactivar', 'delete', '/categorias/5', (c) => c.desactivar(5), 204],
    ['reactivar', 'put', '/categorias/5/reactivar', (c) => c.reactivar(5), 200],
  ];

  it.each(casos)(
    '%s usa el verbo correcto y refresca el listado una sola vez',
    async (_nombre, verbo, ruta, ejecutar, status) => {
      const consultas = simularListado();
      let recibido;
      server.use(
        http[verbo](`${BASE}${ruta}`, async ({ request }) => {
          recibido = request.method;
          return status === 204
            ? new HttpResponse(null, { status })
            : HttpResponse.json({ id: 5 }, { status });
        }),
      );
      const { result } = montar();
      await cargado(result);

      let resultado;
      await act(async () => {
        resultado = await ejecutar(result.current);
      });
      await sinRefresco(result);

      expect(recibido).toBe(verbo.toUpperCase());
      expect(resultado.ok).toBe(true);
      expect(consultas).toHaveLength(2);
      expect(result.current.errorMutacion).toBeNull();
    },
  );

  it('crear en la página 2 refresca esa misma página sin mostrar el esqueleto', async () => {
    const consultas = simularListado();
    server.use(
      http.post(`${BASE}/categorias`, () => HttpResponse.json({ id: 7 }, { status: 201 })),
    );
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(2));
    await waitFor(() => expect(result.current.page.page).toBe(2));

    // Se retiene la respuesta del refresco para observar el estado intermedio.
    const puerta = crearPuerta();
    server.use(
      http.get(`${BASE}/categorias`, async ({ request }) => {
        await puerta.abierta;
        consultas.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json(sobre([{ id: 3 }], { page: 2 }));
      }),
    );
    await act(async () => {
      await result.current.crear({ nombre: 'x' });
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.data).toEqual([{ id: 3 }]);

    puerta.abrir();
    await sinRefresco(result);
    expect(consultas.at(-1)).toMatchObject({ page: '2' });
    expect(consultas).toHaveLength(3);
  });

  it('si desactivar deja vacía la última página, retrocede a la anterior', async () => {
    let borrado = false;
    server.use(
      http.get(`${BASE}/categorias`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 1 && borrado) return HttpResponse.json(sobre([], { page, totalPages: 1 }));
        return HttpResponse.json(sobre([{ id: page + 1 }], { page, totalPages: borrado ? 1 : 2 }));
      }),
      http.delete(`${BASE}/categorias/2`, () => {
        borrado = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = montar();
    await cargado(result);
    act(() => result.current.onPageChange(1));
    await waitFor(() => expect(result.current.page.page).toBe(1));

    await act(async () => {
      await result.current.desactivar(2);
    });
    await waitFor(() => expect(result.current.page.page).toBe(0));
    await cargado(result);
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('isSaving sigue activo hasta que terminan todas las mutaciones concurrentes', async () => {
    simularListado();
    const puertaA = crearPuerta();
    const puertaB = crearPuerta();
    server.use(
      http.put(`${BASE}/categorias/1`, async () => {
        await puertaA.abierta;
        return HttpResponse.json({ id: 1 });
      }),
      http.put(`${BASE}/categorias/2`, async () => {
        await puertaB.abierta;
        return HttpResponse.json({ id: 2 });
      }),
    );
    const { result } = montar();
    await cargado(result);

    let a;
    let b;
    act(() => {
      a = result.current.actualizar(1, {});
      b = result.current.actualizar(2, {});
    });
    expect(result.current.isSaving).toBe(true);

    puertaA.abrir();
    await act(async () => a);
    expect(result.current.isSaving).toBe(true);

    puertaB.abrir();
    await act(async () => b);
    expect(result.current.isSaving).toBe(false);
  });

  it('un 400 con errores por campo queda en errorMutacion y no refresca', async () => {
    const consultas = simularListado();
    server.use(
      http.post(`${BASE}/categorias`, () =>
        HttpResponse.json(
          { status: 400, detail: 'Validación', errores: { nombre: 'Es obligatorio' } },
          { status: 400 },
        ),
      ),
    );
    const { result } = montar();
    await cargado(result);

    let resultado;
    await act(async () => {
      resultado = await result.current.crear({});
    });

    expect(resultado.ok).toBe(false);
    expect(resultado.error.status).toBe(400);
    expect(result.current.errorMutacion).toEqual({
      general: null,
      campos: { nombre: 'Es obligatorio' },
    });
    expect(result.current.isRefreshing).toBe(false);
    expect(consultas).toHaveLength(1);

    act(() => result.current.limpiarErrorMutacion());
    expect(result.current.errorMutacion).toBeNull();
  });

  it('un 409 de negocio muestra el detalle; con tipo transicion-invalida, el texto de UX §9', async () => {
    simularListado();
    const conflicto = (tipo, detail) =>
      HttpResponse.json(
        { type: `https://api.universidad.edu/errors/${tipo}`, status: 409, detail },
        { status: 409 },
      );
    server.use(
      http.delete(`${BASE}/categorias/5`, () =>
        conflicto('area-con-usuarios', 'El área tiene usuarios activos.'),
      ),
      http.delete(`${BASE}/categorias/6`, () =>
        conflicto('transicion-invalida', 'Detalle técnico'),
      ),
    );
    const { result } = montar();
    await cargado(result);

    await act(async () => {
      await result.current.desactivar(5);
    });
    expect(result.current.errorMutacion).toEqual({
      general: 'El área tiene usuarios activos.',
      campos: {},
    });

    await act(async () => {
      await result.current.desactivar(6);
    });
    expect(result.current.errorMutacion.general).toMatch(/ya cambió de estado/);
  });

  it('un intento nuevo limpia el error previo; un éxito concurrente no borra un fallo', async () => {
    simularListado();
    const puertaFallo = crearPuerta();
    server.use(
      http.delete(`${BASE}/categorias/5`, async () => {
        await puertaFallo.abierta;
        return HttpResponse.json({ status: 409, detail: 'En uso.' }, { status: 409 });
      }),
      http.put(`${BASE}/categorias/6`, () => HttpResponse.json({ id: 6 })),
    );
    const { result } = montar();
    await cargado(result);

    let fallida;
    act(() => {
      fallida = result.current.desactivar(5);
    });
    await act(async () => {
      await result.current.actualizar(6, {}); // éxito mientras la otra sigue pendiente
    });
    puertaFallo.abrir();
    await act(async () => fallida);
    expect(result.current.errorMutacion).toEqual({ general: 'En uso.', campos: {} });

    await act(async () => {
      await result.current.actualizar(6, {}); // intento nuevo: limpia el error anterior
    });
    expect(result.current.errorMutacion).toBeNull();
  });

  it('un cambio de ruta descarta el error de mutación de la pantalla anterior', async () => {
    simularListado();
    server.use(
      http.get(`${BASE}/areas`, () => HttpResponse.json(sobre([{ id: 1 }]))),
      http.delete(`${BASE}/categorias/5`, () =>
        HttpResponse.json({ status: 409, detail: 'En uso.' }, { status: 409 }),
      ),
    );
    const { result, rerender } = renderHook(({ ruta }) => useCrud(ruta), {
      initialProps: { ruta: '/categorias' },
    });
    await cargado(result);
    await act(async () => {
      await result.current.desactivar(5);
    });
    expect(result.current.errorMutacion).not.toBeNull();

    rerender({ ruta: '/areas' });
    expect(result.current.errorMutacion).toBeNull();
    await cargado(result);
  });

  it('no actualiza estado si se desmonta con la mutación en vuelo', async () => {
    simularListado();
    const puerta = crearPuerta();
    server.use(
      http.post(`${BASE}/categorias`, async () => {
        await puerta.abierta;
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = montar();
    await cargado(result);

    let promesa;
    act(() => {
      promesa = result.current.crear({ nombre: 'x' });
    });
    unmount();
    puerta.abrir();
    await expect(promesa).resolves.toMatchObject({ ok: true });
    expect(errores).not.toHaveBeenCalled();
  });
});
