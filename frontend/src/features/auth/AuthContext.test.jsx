import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, STORAGE_KEY, useAuth } from './AuthContext.jsx';
import { server } from '../../test/server.js';

// JWT sin firmar solo para caducidad local (la firma la valida el backend).
function tokenConExp(expSegundos) {
  const aBase64Url = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${aBase64Url({ alg: 'none' })}.${aBase64Url({ sub: 'juan@universidad.edu', exp: expSegundos })}.firma`;
}

const tokenVigente = () => tokenConExp(Math.floor(Date.now() / 1000) + 3600);
const tokenVencido = () => tokenConExp(Math.floor(Date.now() / 1000) - 10);

const usuarioEjemplo = {
  id: 7,
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@universidad.edu',
  rol: 'ESTUDIANTE',
  idArea: null,
};

const respuestaAuthEjemplo = {
  token: tokenVigente(),
  tipo: 'Bearer',
  expiraEn: 28800,
  usuario: usuarioEjemplo,
};

function Consumidor({ onLista }) {
  const auth = useAuth();
  onLista?.(auth);
  if (auth.isLoading) return <p>Cargando…</p>;
  return (
    <div>
      <p>autenticado: {auth.isAuthenticated ? 'sí' : 'no'}</p>
      <p>usuario: {auth.usuario ? `${auth.usuario.nombre} ${auth.usuario.apellido}` : 'nadie'}</p>
      <button type="button" onClick={() => auth.login({ correo: 'j@u.edu', password: 'x' })}>
        entrar
      </button>
      <button type="button" onClick={auth.logout}>
        salir
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthContext', () => {
  it('[AUTH-03] restaura una sesión válida persistida sin parpadeo', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: tokenVigente(), usuario: usuarioEjemplo }),
    );

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    expect(await screen.findByText('autenticado: sí')).toBeInTheDocument();
    expect(screen.getByText('usuario: Juan Pérez')).toBeInTheDocument();
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument();
  });

  it('[AUTH-03] un token vencido se limpia y no autentica', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: tokenVencido(), usuario: usuarioEjemplo }),
    );

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    expect(await screen.findByText('autenticado: no')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('[AUTH-03] localStorage roto o con JSON inválido no rompe la app', async () => {
    localStorage.setItem(STORAGE_KEY, '{json-roto');
    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );
    expect(await screen.findByText('autenticado: no')).toBeInTheDocument();

    localStorage.clear();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('bloqueado');
    });
    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );
    expect(await screen.findAllByText('autenticado: no')).toBeTruthy();
  });

  it('[AUTH-03] login guarda la sesión y logout la borra', async () => {
    server.use(http.post('*/api/v1/auth/login', () => HttpResponse.json(respuestaAuthEjemplo)));
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );
    await screen.findByText('autenticado: no');

    await user.click(screen.getByRole('button', { name: 'entrar' }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).usuario.correo).toBe(
        'juan@universidad.edu',
      ),
    );
    expect(await screen.findByText('autenticado: sí')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'salir' }));
    expect(await screen.findByText('autenticado: no')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('[AUTH-03] un 401 de login no guarda nada y deja el error normalizado', async () => {
    const error401 = {
      type: 'https://servicios.universidad.edu/problemas/no-autenticado',
      title: 'No autenticado',
      status: 401,
      detail: 'Credenciales inválidas',
      traceId: 'abc123',
    };
    server.use(
      http.post('*/api/v1/auth/login', () => HttpResponse.json(error401, { status: 401 })),
    );

    let promesaLogin = null;
    function Captor() {
      const auth = useAuth();
      useEffect(() => {
        if (!auth.isLoading && !promesaLogin) {
          promesaLogin = auth.login({ correo: 'x', password: 'y' }).then(
            () => 'ok',
            (e) => e,
          );
        }
      }, [auth]);
      return null;
    }
    render(
      <AuthProvider>
        <Captor />
      </AuthProvider>,
    );

    await waitFor(async () => expect(promesaLogin).not.toBeNull());
    const error = await promesaLogin;
    expect(error.status).toBe(401);
    expect(error.detail).toBe('Credenciales inválidas');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
