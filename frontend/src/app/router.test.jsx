import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './router.jsx';

const renderAt = (path) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};

// Mapa de rutas: docs/01-definicion/ux-ui-prototipo.md §3
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
  it.each(placeholders)('[BASE-04 CA-4] la ruta %s muestra su encabezado "%s"', (path, heading) => {
    renderAt(path);

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

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

  it('[BASE-04 CA-4] "/admin" redirige a /admin/usuarios', () => {
    const router = renderAt('/admin');

    expect(router.state.location.pathname).toBe('/admin/usuarios');
  });
});
