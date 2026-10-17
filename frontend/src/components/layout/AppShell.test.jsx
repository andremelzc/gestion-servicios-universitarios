import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, STORAGE_KEY } from '../../features/auth/AuthContext.jsx';
import AppShell from './AppShell.jsx';

// JWT sin firmar solo para caducidad local (la firma la valida el backend).
function tokenVigente() {
  const aBase64Url = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${aBase64Url({ alg: 'none' })}.${aBase64Url({ sub: 'juan@universidad.edu', exp })}.firma`;
}

const USUARIO = {
  id: 7,
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@universidad.edu',
  rol: 'ESTUDIANTE',
  idArea: null,
};

const rutas = [
  { path: '/login', element: <p>Iniciar sesión</p> },
  {
    path: '/perfil',
    element: (
      <AppShell>
        <p>Contenido de la página</p>
      </AppShell>
    ),
  },
];

function conSesion(usuario = USUARIO) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: tokenVigente(), usuario }));
}

function renderShell() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/perfil'] });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

const botonUsuario = () => screen.findByRole('button', { name: /juan pérez/i });
const opcionSalir = () => screen.queryByRole('button', { name: 'Cerrar sesión' });

beforeEach(() => {
  localStorage.clear();
});

describe('AppShell (AUTH-19 · menú de usuario y cierre de sesión)', () => {
  it('[AUTH-19] sin sesión muestra el contenido de la página sin menú de usuario', async () => {
    renderShell();

    expect(await screen.findByText('Contenido de la página')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('[AUTH-19] con sesión muestra la marca, el nombre y el rol, con el menú cerrado', async () => {
    conSesion();
    renderShell();

    expect(screen.getByText('Gestión de Servicios Universitarios')).toBeInTheDocument();
    const boton = await botonUsuario();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Estudiante')).toBeInTheDocument();
    expect(opcionSalir()).not.toBeInTheDocument();
  });

  it('[AUTH-19] al pulsar el botón se abre el menú y aria-expanded pasa a true', async () => {
    conSesion();
    renderShell();
    const user = userEvent.setup();
    const boton = await botonUsuario();

    await user.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('[AUTH-19] "Cerrar sesión" borra la clave persistida y navega a /login', async () => {
    conSesion();
    const router = renderShell();
    const user = userEvent.setup();

    await user.click(await botonUsuario());
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
  });

  it('[AUTH-19] tras cerrar sesión, retroceder no vuelve a la pantalla protegida', async () => {
    // CA-13: la navegación al login usa `replace`, así que el historial no conserva la
    // pantalla autenticada; el guard completo por sesión es del ProtectedRoute (#32).
    conSesion();
    const router = renderShell();
    const user = userEvent.setup();

    await user.click(await botonUsuario());
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByText('Iniciar sesión');

    await act(() => router.navigate(-1));

    expect(router.state.location.pathname).toBe('/login');
    expect(screen.queryByText('Contenido de la página')).not.toBeInTheDocument();
  });

  it('[AUTH-19] Escape cierra el menú y devuelve el foco al botón de usuario', async () => {
    conSesion();
    renderShell();
    const user = userEvent.setup();
    const boton = await botonUsuario();

    await user.click(boton);
    await user.keyboard('{Escape}');

    expect(opcionSalir()).not.toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton).toHaveFocus();
  });

  it('[AUTH-19] un clic fuera del menú lo cierra', async () => {
    conSesion();
    renderShell();
    const user = userEvent.setup();

    await user.click(await botonUsuario());
    expect(opcionSalir()).toBeInTheDocument();

    await user.click(screen.getByText('Contenido de la página'));

    expect(opcionSalir()).not.toBeInTheDocument();
  });

  it('[AUTH-19] un rol desconocido se muestra tal cual, sin etiqueta', async () => {
    conSesion({ ...USUARIO, rol: 'PASANTE' });
    renderShell();

    expect(await botonUsuario()).toHaveTextContent('PASANTE');
  });
});
