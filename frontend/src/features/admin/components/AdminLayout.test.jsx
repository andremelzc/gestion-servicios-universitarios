import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SECCIONES_ADMIN } from '../secciones.js';
import AdminLayout from './AdminLayout.jsx';

const renderEn = (path) => {
  const router = createMemoryRouter(
    [
      {
        element: <AdminLayout />,
        children: SECCIONES_ADMIN.map(({ to, etiqueta }) => ({
          path: to,
          element: <h1>Pantalla {etiqueta.toLowerCase()}</h1>,
        })),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

// La navegación entre secciones vive en el menú lateral del shell (ver AppShell.test.jsx): el
// layout solo resuelve la ruta hija, sin añadir navegación ni envoltorios propios.
describe('AdminLayout', () => {
  it('[ADM-13] muestra la pantalla de la ruta hija en el Outlet', () => {
    renderEn('/admin/prioridades');

    expect(screen.getByRole('heading', { name: 'Pantalla prioridades' })).toBeInTheDocument();
  });

  it('[ADM-13] no añade navegación propia (evita duplicar el menú lateral)', () => {
    renderEn('/admin/usuarios');

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('[ADM-13] declara las 5 secciones del módulo, con sus rutas /admin/*', () => {
    expect(SECCIONES_ADMIN.map((s) => s.etiqueta)).toEqual([
      'Usuarios',
      'Áreas',
      'Categorías',
      'Prioridades',
      'Estados',
    ]);
    expect(SECCIONES_ADMIN.every((s) => s.to.startsWith('/admin/'))).toBe(true);
  });
});
