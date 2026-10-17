import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../features/auth/AuthContext.jsx';
import Providers from './providers.jsx';
import { routes } from './router.jsx';

// Igual que App.jsx: las páginas pueden usar useAuth() (p. ej. /login, AUTH-16),
// que exige el AuthProvider de Providers.
const renderAt = (path) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  return router;
};

// Siembra una sesión persistida (token sin `exp`: se considera vigente) con el rol indicado.
const iniciarSesionComo = (rol) =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token: 'jwt-de-prueba', usuario: { id: 1, nombre: 'Ana', rol } }),
  );

beforeEach(() => localStorage.clear());

// Mapa de rutas: docs/01-definicion/ux-ui-prototipo.md §3 (con sesión de ADMIN, que accede a todo)
const placeholders = [
  ['/login', 'Iniciar sesión'],
  ['/registro', 'Crear cuenta'],
  ['/mis-solicitudes', 'Mis solicitudes'],
  ['/solicitudes/nueva', 'Nueva solicitud'],
  ['/solicitudes/42', 'Detalle de solicitud'],
  ['/perfil', 'Perfil'],
  ['/bandeja', 'Bandeja de solicitudes'],
  ['/dashboard', 'Dashboard'],
  ['/admin/usuarios', 'Administración de usuarios'],
  ['/admin/areas', 'Administración de áreas'],
  ['/admin/categorias', 'Administración de categorías'],
  ['/admin/prioridades', 'Administración de prioridades'],
  ['/admin/estados', 'Administración de estados'],
];

describe('router', () => {
  it.each(placeholders)(
    '[BASE-04 CA-4] la ruta %s muestra su encabezado "%s"',
    async (path, heading) => {
      iniciarSesionComo('ADMIN');
      renderAt(path);

      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    },
  );

  it('[BASE-04 CA-4] una ruta desconocida muestra la página 404', () => {
    renderAt('/ruta-que-no-existe');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });

  it('[BASE-04 CA-4] "/" redirige a /login', () => {
    const router = renderAt('/');

    expect(router.state.location.pathname).toBe('/login');
  });

  it('[BASE-04 CA-4] "/admin" redirige a /admin/usuarios (ADMIN)', async () => {
    iniciarSesionComo('ADMIN');
    const router = renderAt('/admin');

    await screen.findByRole('heading', { level: 1, name: 'Administración de usuarios' });
    expect(router.state.location.pathname).toBe('/admin/usuarios');
  });

  // Matriz de UX §3 por rol: [ruta, rol, encabezado esperado]. Si el rol no puede entrar,
  // el encabezado es el de la página 403; si puede, el de la pantalla de esa ruta.
  const NO = 'Acceso no permitido';
  const protegidas = [
    ['/mis-solicitudes', 'ESTUDIANTE', 'Mis solicitudes'],
    ['/solicitudes/nueva', 'ESTUDIANTE', 'Nueva solicitud'],
    ['/solicitudes/42', 'ESTUDIANTE', 'Detalle de solicitud'],
    ['/perfil', 'ESTUDIANTE', 'Perfil'],
    ['/bandeja', 'ESTUDIANTE', NO],
    ['/dashboard', 'ESTUDIANTE', NO],
    ['/admin/usuarios', 'ESTUDIANTE', NO],
    ['/bandeja', 'TECNICO', 'Bandeja de solicitudes'],
    ['/dashboard', 'TECNICO', 'Dashboard'],
    ['/admin/areas', 'TECNICO', NO],
    ['/bandeja', 'SUPERVISOR', 'Bandeja de solicitudes'],
    ['/dashboard', 'SUPERVISOR', 'Dashboard'],
    ['/admin/categorias', 'SUPERVISOR', NO],
    ['/admin/usuarios', 'ADMIN', 'Administración de usuarios'],
    ['/admin/areas', 'ADMIN', 'Administración de áreas'],
    ['/admin/categorias', 'ADMIN', 'Administración de categorías'],
    ['/admin/prioridades', 'ADMIN', 'Administración de prioridades'],
    ['/admin/estados', 'ADMIN', 'Administración de estados'],
  ];

  it.each(protegidas)(
    '[AUTH-18 CA-10] la ruta %s con rol %s muestra "%s"',
    async (path, rol, encabezado) => {
      iniciarSesionComo(rol);
      renderAt(path);

      expect(
        await screen.findByRole('heading', { level: 1, name: encabezado }),
      ).toBeInTheDocument();
    },
  );

  it.each([
    '/mis-solicitudes',
    '/solicitudes/nueva',
    '/solicitudes/42',
    '/perfil',
    '/bandeja',
    '/dashboard',
    '/admin',
    '/admin/usuarios',
  ])('[AUTH-18 CA-9] sin sesión, %s redirige a /login y guarda el origen', async (path) => {
    const router = renderAt(path);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state.from.pathname).toBe(path);
  });

  it('[AUTH-18] /login y /registro siguen siendo públicos', async () => {
    renderAt('/registro');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Crear cuenta' }),
    ).toBeInTheDocument();
  });

  it('[AUTH-18] una ruta desconocida muestra 404 también sin sesión', () => {
    renderAt('/no-existe');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });
});
