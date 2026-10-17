import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

// Estado de sesión controlado por cada prueba (AuthContext real se cubre en su propio archivo).
let sesion;
vi.mock('../../features/auth/AuthContext.jsx', () => ({ useAuth: () => sesion }));

const SIN_SESION = { isLoading: false, isAuthenticated: false, usuario: null };

const autenticado = (rol) => ({
  isLoading: false,
  isAuthenticated: true,
  usuario: { rol },
});

function Login() {
  const { state, pathname } = useLocation();
  return (
    <main>
      <h1>Pantalla de login</h1>
      <p data-testid="ubicacion">{pathname}</p>
      <p data-testid="origen">{state?.from ? `${state.from.pathname}${state.from.search}` : ''}</p>
    </main>
  );
}

function renderEn(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mis-solicitudes" element={<h1>Mis solicitudes</h1>} />
          <Route element={<RoleRoute allowedRoles={['TECNICO', 'SUPERVISOR', 'ADMIN']} />}>
            <Route path="/bandeja" element={<h1>Bandeja</h1>} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<h1>Administración</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sesion = autenticado('ESTUDIANTE');
});

describe('ProtectedRoute (AUTH-18 · CA-9)', () => {
  it('[AUTH-18] CA-9: sin sesión redirige a /login', () => {
    sesion = SIN_SESION;
    renderEn('/mis-solicitudes');

    expect(screen.getByRole('heading', { name: 'Pantalla de login' })).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login');
    expect(screen.queryByText('Mis solicitudes')).not.toBeInTheDocument();
  });

  it('[AUTH-18] CA-9: conserva la ubicación de origen (con query) en state.from', () => {
    sesion = SIN_SESION;
    renderEn('/mis-solicitudes?estado=ASIGNADA');

    expect(screen.getByTestId('origen')).toHaveTextContent('/mis-solicitudes?estado=ASIGNADA');
  });

  it('[AUTH-18] con sesión muestra la ruta hija', () => {
    renderEn('/mis-solicitudes');

    expect(screen.getByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
  });

  it('[AUTH-18] mientras carga la sesión no redirige ni muestra contenido, y avisa por aria', () => {
    sesion = { isLoading: true, isAuthenticated: false, usuario: null };
    renderEn('/mis-solicitudes');

    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Mis solicitudes')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando sesión…');
  });
});

describe('RoleRoute (AUTH-18 · CA-10)', () => {
  it.each(['TECNICO', 'SUPERVISOR', 'ADMIN'])(
    '[AUTH-18] CA-10: el rol %s accede a /bandeja',
    (rol) => {
      sesion = autenticado(rol);
      renderEn('/bandeja');

      expect(screen.getByRole('heading', { name: 'Bandeja' })).toBeInTheDocument();
    },
  );

  it('[AUTH-18] CA-10: un rol no permitido ve la página 403 y no el contenido', () => {
    renderEn('/bandeja');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acceso no permitido' }),
    ).toBeInTheDocument();
    expect(screen.getByText('No tienes permiso para realizar esta acción.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bandeja' })).not.toBeInTheDocument();
  });

  it('[AUTH-18] la página 403 ofrece volver a Mis solicitudes', () => {
    sesion = autenticado('TECNICO');
    renderEn('/admin');

    expect(screen.getByRole('link', { name: 'Ir a Mis solicitudes' })).toHaveAttribute(
      'href',
      '/mis-solicitudes',
    );
  });

  it('[AUTH-18] un rol desconocido o ausente cae en 403 (denegar por defecto)', () => {
    sesion = autenticado(undefined);
    renderEn('/admin');

    expect(screen.getByRole('heading', { name: 'Acceso no permitido' })).toBeInTheDocument();
  });

  it('[AUTH-18] sin sesión dentro de RoleRoute redirige a /login (la protección va primero)', () => {
    sesion = SIN_SESION;
    renderEn('/admin');

    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login');
  });

  it('[AUTH-18] mientras carga la sesión dentro de RoleRoute no muestra 403 ni redirige', () => {
    sesion = { isLoading: true, isAuthenticated: false, usuario: null };
    renderEn('/admin');

    expect(screen.getByRole('status')).toHaveTextContent('Cargando sesión…');
    expect(screen.queryByText('Acceso no permitido')).not.toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
  });

  it('[AUTH-18] la página 403 mueve el foco al h1 para que se anuncie (tabIndex -1)', () => {
    renderEn('/admin');

    const titulo = screen.getByRole('heading', { level: 1, name: 'Acceso no permitido' });
    expect(titulo).toHaveAttribute('tabindex', '-1');
    expect(titulo).toHaveFocus();
  });
});
