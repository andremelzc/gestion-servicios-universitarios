import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server.js';
import DashboardPage from './DashboardPage.jsx';

// Sesión aún restaurándose: `useAuth` informa `isLoading` (no se puede forzar con el provider real).
vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ isLoading: true, usuario: null }),
}));

afterEach(() => {
  server.events.removeAllListeners();
  vi.restoreAllMocks();
});

describe('DashboardPage mientras la sesión carga', () => {
  it('[DASH-15] muestra un aviso accesible "Cargando…" y no pide nada', async () => {
    const fetchEspia = vi.spyOn(globalThis, 'fetch');
    render(<DashboardPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    expect(screen.queryByRole('heading', { name: 'Acceso no permitido' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();
    expect(fetchEspia).not.toHaveBeenCalled();
  });
});
