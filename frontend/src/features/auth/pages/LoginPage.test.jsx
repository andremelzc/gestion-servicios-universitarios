import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AVISO_SESION_EXPIRADA, CLAVE_AVISO_SESION } from '../../../services/apiClient.js';
import { server } from '../../../test/server.js';
import { AuthProvider, STORAGE_KEY } from '../AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

const USUARIO = {
  id: 7,
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@universidad.edu',
  rol: 'ESTUDIANTE',
  idArea: null,
};

const RESPUESTA_OK = {
  token: 'jwt-de-prueba',
  tipo: 'Bearer',
  expiraEn: 28800,
  usuario: USUARIO,
};

const MSG_CREDENCIALES = 'Credenciales inválidas. Verifica tu correo y contraseña.';
const MSG_RATE_LIMIT = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
const MSG_SIN_CONEXION = 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.';

const handlerLogin = (respuesta) => http.post('*/api/v1/auth/login', () => respuesta);

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<p>Registro</p>} />
          <Route path="/mis-solicitudes" element={<p>Mis solicitudes</p>} />
          <Route path="/bandeja" element={<p>Bandeja de solicitudes</p>} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function llenarFormulario(
  user,
  { correo = 'juan@universidad.edu', password = 'Password123' } = {},
) {
  await user.type(screen.getByLabelText('Correo institucional'), correo);
  await user.type(screen.getByLabelText('Contraseña'), password);
}

const botonEnviar = () => screen.getByRole('button', { name: 'Iniciar sesión' });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('LoginPage (AUTH-16 · CA-1, CA-2, UAT-01)', () => {
  it('[AUTH-16] renderiza los campos, el botón y el enlace a registro', () => {
    renderLogin();

    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    expect(botonEnviar()).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
  });

  it('[AUTH-16] con campos vacíos muestra los mensajes y enfoca el correo', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(botonEnviar());

    expect(await screen.findByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toHaveFocus();
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('aria-invalid', 'true');
  });

  it('[AUTH-16] un correo con formato inválido no llega al servidor', async () => {
    const user = userEvent.setup();
    let llamado = false;
    server.use(
      http.post('*/api/v1/auth/login', () => {
        llamado = true;
        return HttpResponse.json(RESPUESTA_OK);
      }),
    );
    renderLogin();

    await llenarFormulario(user, { correo: 'juan.@gmail' });
    await user.click(botonEnviar());

    expect(await screen.findByText('Debe ser un correo electrónico válido')).toBeInTheDocument();
    expect(llamado).toBe(false);
    expect(screen.getByLabelText('Correo institucional')).toHaveFocus();
  });

  it('[AUTH-16] el login no exige dominio institucional: un correo externo se envía', async () => {
    const user = userEvent.setup();
    let cuerpoRecibido = null;
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        cuerpoRecibido = await request.json();
        return HttpResponse.json(RESPUESTA_OK);
      }),
    );
    renderLogin();

    await llenarFormulario(user, { correo: 'juan@gmail.com' });
    await user.click(botonEnviar());

    expect(await screen.findByText('Mis solicitudes')).toBeInTheDocument();
    expect(cuerpoRecibido).toEqual({ correo: 'juan@gmail.com', password: 'Password123' });
  });

  it('[AUTH-16] CA-1: el login exitoso normaliza el correo, guarda la sesión y redirige', async () => {
    const user = userEvent.setup();
    let cuerpoRecibido = null;
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        cuerpoRecibido = await request.json();
        return HttpResponse.json(RESPUESTA_OK);
      }),
    );
    renderLogin();

    await llenarFormulario(user, { correo: ' JUAN@UNIVERSIDAD.EDU' });
    await user.click(botonEnviar());

    expect(await screen.findByText('Mis solicitudes')).toBeInTheDocument();
    expect(cuerpoRecibido).toEqual({ correo: 'juan@universidad.edu', password: 'Password123' });
    const sesion = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(sesion.token).toBe('jwt-de-prueba');
    expect(sesion.usuario.rol).toBe('ESTUDIANTE');
  });

  it.each([
    ['ESTUDIANTE', 'Mis solicitudes'],
    ['TECNICO', 'Bandeja de solicitudes'],
    ['SUPERVISOR', 'Bandeja de solicitudes'],
    ['ADMIN', 'Dashboard'],
  ])('[AUTH-16] CA-1: el rol %s redirige a %s', async (rol, pantalla) => {
    const user = userEvent.setup();
    server.use(handlerLogin(HttpResponse.json({ ...RESPUESTA_OK, usuario: { ...USUARIO, rol } })));
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByText(pantalla)).toBeInTheDocument();
  });

  it('[AUTH-16] un rol desconocido cae al destino menos privilegiado', async () => {
    const user = userEvent.setup();
    server.use(
      handlerLogin(HttpResponse.json({ ...RESPUESTA_OK, usuario: { ...USUARIO, rol: 'PASANTE' } })),
    );
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByText('Mis solicitudes')).toBeInTheDocument();
  });

  it('[AUTH-16] CA-2: credenciales inválidas muestran la alerta y no guardan sesión', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            type: 'https://servicios.universidad.edu/problemas/no-autenticado',
            title: 'No autenticado',
            status: 401,
            detail: 'Credenciales inválidas',
            traceId: 'abc123',
          },
          { status: 401 },
        ),
      ),
    );
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG_CREDENCIALES);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(botonEnviar()).toBeEnabled();
  });

  it('[AUTH-16] el 429 se muestra con el microcopy de UX §9', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json({ status: 429, detail: 'Too many requests' }, { status: 429 }),
      ),
    );
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG_RATE_LIMIT);
  });

  it('[AUTH-16] sin conexión se avisa con el microcopy de UX §9', async () => {
    const user = userEvent.setup();
    server.use(http.post('*/api/v1/auth/login', () => HttpResponse.error()));
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG_SIN_CONEXION);
  });

  it('[AUTH-16] un 400 del servidor se pinta por campo', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            status: 400,
            detail: 'Error de validación',
            errores: { correo: 'El correo no tiene el formato esperado' },
          },
          { status: 400 },
        ),
      ),
    );
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    expect(await screen.findByText('El correo no tiene el formato esperado')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('aria-invalid', 'true');
  });

  it('[AUTH-16] el botón se deshabilita con spinner mientras envía', async () => {
    const user = userEvent.setup();
    let resolver;
    server.use(
      http.post(
        '*/api/v1/auth/login',
        () =>
          new Promise((resolve) => {
            resolver = resolve;
          }),
      ),
    );
    renderLogin();

    await llenarFormulario(user);
    await user.click(botonEnviar());

    const enProceso = await screen.findByRole('button', { name: 'Iniciando sesión…' });
    expect(enProceso).toBeDisabled();
    expect(enProceso).toHaveAttribute('aria-busy', 'true');

    resolver(HttpResponse.json(RESPUESTA_OK));
    expect(await screen.findByText('Mis solicitudes')).toBeInTheDocument();
  });

  it('[AUTH-16] muestra el aviso de sesión expirada de apiClient una sola vez', async () => {
    sessionStorage.setItem(CLAVE_AVISO_SESION, '1');
    const primera = renderLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent(AVISO_SESION_EXPIRADA);

    primera.unmount();
    renderLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('[AUTH-16] alterna la visibilidad de la contraseña con el botón Mostrar/Ocultar', async () => {
    const user = userEvent.setup();
    renderLogin();
    const campo = screen.getByLabelText('Contraseña');

    expect(campo).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(campo).toHaveAttribute('type', 'password');
  });
});
