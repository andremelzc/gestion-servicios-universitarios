import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { paginaDe } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import { restaurarAncho, simularAncho } from '../../../test/simularAncho.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import BandejaPage from './BandejaPage.jsx';

vi.mock('../../auth/AuthContext.jsx', () => ({ useAuth: vi.fn() }));

// Cuenta las consultas a la bandeja: una vista no permitida no debe llegar a pedirla.
let consultas;
beforeEach(() => {
  consultas = 0;
  server.use(
    http.get('*/api/v1/solicitudes', () => {
      consultas += 1;
      return HttpResponse.json(paginaDe([]));
    }),
  );
  simularAncho(true);
});
afterEach(restaurarAncho);

function conSesion(sesion) {
  vi.mocked(useAuth).mockReturnValue({ isLoading: false, usuario: null, ...sesion });
  render(
    <MemoryRouter>
      <BandejaPage />
    </MemoryRouter>,
  );
}

describe('BandejaPage', () => {
  it('muestra la bandeja del técnico a quien tiene rol TECNICO', async () => {
    conSesion({ usuario: { rol: 'TECNICO' } });
    expect(await screen.findByRole('heading', { name: 'Mis asignadas' })).toBeInTheDocument();
  });

  it.each(['SUPERVISOR', 'ADMIN'])('muestra la bandeja del supervisor a %s', async (rol) => {
    conSesion({ usuario: { rol } });
    expect(
      await screen.findByRole('heading', { name: 'Bandeja de solicitudes' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['ESTUDIANTE', { rol: 'ESTUDIANTE' }],
    ['un rol desconocido', { rol: 'INVITADO' }],
    ['un usuario sin rol', {}],
    ['sin usuario', null],
  ])('para %s muestra el acceso no permitido y no consulta la bandeja', async (_, usuario) => {
    conSesion({ usuario });
    expect(await screen.findByRole('heading', { name: 'Acceso no permitido' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Bandeja de solicitudes' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mis asignadas' })).not.toBeInTheDocument();
    expect(consultas).toBe(0);
  });

  it('mientras se restaura la sesión muestra un estado de carga y no decide la vista', () => {
    conSesion({ isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(consultas).toBe(0);
  });
});
