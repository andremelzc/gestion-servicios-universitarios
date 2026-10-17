import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from '../features/auth/AuthContext.jsx';
import { server } from '../test/server.js';
import {
  AVISO_SESION_EXPIRADA,
  CLAVE_SESION,
  apiClient,
  configurarApiClient,
  consumirAvisoSesion,
  expirarSesion,
  peticion,
} from './apiClient.js';

const TOKEN = 'jwt-de-prueba';

function persistirSesion() {
  localStorage.setItem(CLAVE_SESION, JSON.stringify({ token: TOKEN, usuario: { id: 1 } }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  configurarApiClient(); // manejador por defecto
});

describe('apiClient (AUTH-15 · CA-11)', () => {
  it('[AUTH-15] la clave de sesión no se desincroniza de AuthContext (AUTH-03)', () => {
    expect(CLAVE_SESION).toBe(STORAGE_KEY);
  });

  it('[AUTH-15] añade Authorization Bearer y llama a la base VITE_API_URL', async () => {
    persistirSesion();
    let visto = null;
    server.use(
      http.get('*/api/v1/solicitudes', ({ request }) => {
        visto = { auth: request.headers.get('Authorization'), url: request.url };
        return HttpResponse.json([{ id: 1 }]);
      }),
    );

    const cuerpo = await peticion('/solicitudes');

    expect(visto.auth).toBe(`Bearer ${TOKEN}`);
    expect(visto.url).toContain('/api/v1/solicitudes');
    expect(cuerpo).toEqual([{ id: 1 }]);
  });

  it('[AUTH-15] sin sesión persistida no envía Authorization', async () => {
    let auth = 'sin-ver';
    server.use(
      http.get('*/api/v1/solicitudes', ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json([]);
      }),
    );

    await peticion('/solicitudes');

    expect(auth).toBeNull();
  });

  it('[AUTH-15] normaliza un 400 RFC 7807 con errores por campo, tipo y traceId', async () => {
    server.use(
      http.post('*/api/v1/solicitudes', () =>
        HttpResponse.json(
          {
            type: 'https://servicios.universidad.edu/problemas/validacion',
            title: 'Solicitud inválida',
            status: 400,
            detail: 'Revisa los campos marcados',
            errores: { correo: 'Debe ser un correo electrónico válido' },
            traceId: '4bf92f35',
          },
          { status: 400 },
        ),
      ),
    );

    const fallo = await peticion('/solicitudes', { method: 'POST', body: {} }).catch((e) => e);

    expect(fallo).toMatchObject({
      status: 400,
      detail: 'Revisa los campos marcados',
      errores: { correo: 'Debe ser un correo electrónico válido' },
      traceId: '4bf92f35',
      tipo: 'validacion',
    });
  });

  it('[AUTH-15] un 401 dispara el manejador de sesión y lanza el error normalizado', async () => {
    persistirSesion();
    const alExpirarSesion = vi.fn();
    configurarApiClient({ alExpirarSesion });
    server.use(
      http.get('*/api/v1/solicitudes', () =>
        HttpResponse.json(
          {
            type: 'https://servicios.universidad.edu/problemas/no-autenticado',
            title: 'No autenticado',
            status: 401,
            detail: 'Token expirado o inválido',
            traceId: 'abc123',
          },
          { status: 401 },
        ),
      ),
    );

    const fallo = await peticion('/solicitudes').catch((e) => e);

    expect(alExpirarSesion).toHaveBeenCalledTimes(1);
    expect(fallo).toMatchObject({
      status: 401,
      detail: 'Token expirado o inválido',
      traceId: 'abc123',
    });
  });

  it('[AUTH-15] el 401 de /auth/login no dispara la expiración global (lo pinta la página)', async () => {
    const alExpirarSesion = vi.fn();
    configurarApiClient({ alExpirarSesion });
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            type: 'https://servicios.universidad.edu/problemas/no-autenticado',
            detail: 'Credenciales inválidas',
            status: 401,
            traceId: 'x',
          },
          { status: 401 },
        ),
      ),
    );

    const fallo = await peticion('/auth/login', {
      method: 'POST',
      body: { correo: 'a@u.edu', password: 'b' },
    }).catch((e) => e);

    expect(alExpirarSesion).not.toHaveBeenCalled();
    expect(fallo.status).toBe(401);
    expect(fallo.detail).toBe('Credenciales inválidas');
  });

  it('[AUTH-15] expirarSesion borra la sesión, deja el aviso de UX §9 y navega a /login', () => {
    persistirSesion();
    const navegar = vi.fn();

    expirarSesion({ navegar });

    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login');
    expect(consumirAvisoSesion()).toBe(AVISO_SESION_EXPIRADA);
    expect(consumirAvisoSesion()).toBeNull(); // el aviso es de una sola lectura
  });

  it('[AUTH-15] un fallo de red se normaliza a {status: 0, sinConexion}', async () => {
    server.use(http.get('*/api/v1/solicitudes', () => HttpResponse.error()));

    const fallo = await peticion('/solicitudes').catch((e) => e);

    expect(fallo).toMatchObject({ status: 0, sinConexion: true });
  });

  it('[AUTH-15] 204 sin cuerpo devuelve null (no intenta parsear JSON)', async () => {
    server.use(
      http.delete('*/api/v1/solicitudes/1', () => new HttpResponse(null, { status: 204 })),
    );

    await expect(apiClient.del('/solicitudes/1')).resolves.toBeNull();
  });

  it('[AUTH-15] post envía JSON con Content-Type y devuelve el cuerpo creado', async () => {
    persistirSesion();
    let visto = null;
    server.use(
      http.post('*/api/v1/solicitudes', async ({ request }) => {
        visto = {
          tipo: request.headers.get('Content-Type'),
          auth: request.headers.get('Authorization'),
          cuerpo: await request.json(),
        };
        return HttpResponse.json({ id: 42 }, { status: 201 });
      }),
    );

    const creado = await apiClient.post('/solicitudes', { titulo: 'x' });

    expect(visto.tipo).toContain('application/json');
    expect(visto.auth).toBe(`Bearer ${TOKEN}`);
    expect(visto.cuerpo).toEqual({ titulo: 'x' });
    expect(creado).toEqual({ id: 42 });
  });

  it('[AUTH-15] con FormData no fuerza Content-Type (fetch pone el boundary de multipart)', async () => {
    const formData = new FormData();
    formData.append('titulo', 'x');
    let visto = null;
    server.use(
      http.post('*/api/v1/solicitudes', ({ request }) => {
        visto = request.headers.get('Content-Type');
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );

    await apiClient.post('/solicitudes', formData);

    expect(visto).toContain('multipart/form-data');
  });
});

// Restaura el manejador por defecto aunque la prueba falle a mitad.
afterEach(() => {
  configurarApiClient();
});
