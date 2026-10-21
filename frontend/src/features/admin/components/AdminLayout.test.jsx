import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AdminLayout from './AdminLayout.jsx';

const renderEn = (path) => {
  const router = createMemoryRouter(
    [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/usuarios', element: <h1>Pantalla usuarios</h1> },
          { path: '/admin/areas', element: <h1>Pantalla áreas</h1> },
          { path: '/admin/categorias', element: <h1>Pantalla categorías</h1> },
          { path: '/admin/prioridades', element: <h1>Pantalla prioridades</h1> },
          { path: '/admin/estados', element: <h1>Pantalla estados</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('AdminLayout', () => {
  it('[ADM-13 CA-13] ofrece una navegación "Administración" con las 5 secciones', () => {
    renderEn('/admin/usuarios');

    const nav = screen.getByRole('navigation', { name: 'Administración' });
    const enlaces = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(enlaces).toEqual(['Usuarios', 'Áreas', 'Categorías', 'Prioridades', 'Estados']);
  });

  it('[ADM-13] marca la sección activa con aria-current="page" y solo esa', () => {
    renderEn('/admin/prioridades');

    expect(screen.getByRole('link', { name: 'Prioridades' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Usuarios' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1);
  });

  it('[ADM-13] muestra la pantalla de la ruta en el Outlet y navega al hacer clic', async () => {
    renderEn('/admin/usuarios');
    expect(screen.getByRole('heading', { name: 'Pantalla usuarios' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Estados' }));

    expect(screen.getByRole('heading', { name: 'Pantalla estados' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Estados' })).toHaveAttribute('aria-current', 'page');
  });
});
