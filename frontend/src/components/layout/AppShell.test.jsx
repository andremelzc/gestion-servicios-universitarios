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
  {
    path: '/admin/areas',
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

function renderShell(ruta = '/perfil') {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
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

    expect(screen.getByText('GISU')).toBeInTheDocument();
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

describe('AppShell (menú lateral por rol)', () => {
  it('fija el título de la pestaña según la ruta', async () => {
    conSesion({ ...USUARIO, rol: 'ADMIN' });
    renderShell('/admin/areas');
    await botonUsuario();

    expect(document.title).toBe('Áreas · GISU');
  });

  const enlaces = (nav) => Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
  const principal = () => screen.getByRole('navigation', { name: 'Principal' });

  it('el estudiante ve solo Mis solicitudes, Nueva solicitud y Perfil', async () => {
    conSesion();
    renderShell();
    await botonUsuario();

    expect(enlaces(principal())).toEqual(['Mis solicitudes', 'Nueva solicitud', 'Perfil']);
  });

  it('el supervisor suma Bandeja y Dashboard, pero no Administración', async () => {
    conSesion({ ...USUARIO, rol: 'SUPERVISOR', idArea: 1 });
    renderShell();
    await botonUsuario();

    expect(enlaces(principal())).toEqual([
      'Mis solicitudes',
      'Nueva solicitud',
      'Bandeja',
      'Dashboard',
      'Perfil',
    ]);
  });

  it('el administrador ve además el grupo Administración, con sus 5 secciones, en cualquier pantalla', async () => {
    conSesion({ ...USUARIO, rol: 'ADMIN' });
    renderShell('/perfil');
    await botonUsuario();

    expect(enlaces(principal())).toEqual([
      'Mis solicitudes',
      'Nueva solicitud',
      'Bandeja',
      'Dashboard',
      'Usuarios',
      'Áreas',
      'Categorías',
      'Prioridades',
      'Estados',
      'Perfil',
    ]);
  });

  it('marca con aria-current la sección de Administración en la que está, y solo esa', async () => {
    conSesion({ ...USUARIO, rol: 'ADMIN' });
    renderShell('/admin/areas');
    await botonUsuario();

    expect(screen.getByRole('link', { name: 'Áreas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1);
  });

  it('contraer el menú lo pliega, cambia la etiqueta del botón y recuerda la preferencia', async () => {
    conSesion();
    const user = userEvent.setup();
    renderShell();
    await botonUsuario();
    const contenedor = document.querySelector('.app-shell');
    expect(contenedor).not.toHaveClass('app-shell--colapsado');

    await user.click(screen.getByRole('button', { name: 'Contraer menú' }));

    expect(contenedor).toHaveClass('app-shell--colapsado');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(localStorage.getItem('gisu_menu_colapsado')).toBe('1');
    // Plegado, cada enlace sigue teniendo su nombre accesible.
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toBeInTheDocument();
  });

  it('abre el cajón con el botón de menú, mueve el foco adentro y vuelve con Esc', async () => {
    conSesion();
    const user = userEvent.setup();
    renderShell();
    const abrir = await screen.findByRole('button', { name: 'Abrir menú' });
    expect(abrir).toHaveAttribute('aria-expanded', 'false');

    await user.click(abrir);

    expect(abrir).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.app-shell')).toHaveClass('app-shell--cajon');
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
    // Con el cajón abierto el resto de la página no es alcanzable.
    expect(document.querySelector('.app-shell__principal')).toHaveAttribute('inert');

    await user.keyboard('{Escape}');

    expect(abrir).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.app-shell__principal')).not.toHaveAttribute('inert');
    expect(abrir).toHaveFocus();
  });

  it('el botón Cerrar menú y un clic en el fondo cierran el cajón', async () => {
    conSesion();
    const user = userEvent.setup();
    renderShell();
    await user.click(await screen.findByRole('button', { name: 'Abrir menú' }));

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(document.querySelector('.app-shell')).not.toHaveClass('app-shell--cajon');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(document.querySelector('.app-shell__velo'));
    expect(document.querySelector('.app-shell')).not.toHaveClass('app-shell--cajon');
  });
});
