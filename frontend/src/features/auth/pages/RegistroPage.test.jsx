import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import { AuthProvider, STORAGE_KEY } from '../AuthContext.jsx';
import RegistroPage from './RegistroPage.jsx';

const USUARIO = {
  id: 7,
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@universidad.edu',
  rol: 'ESTUDIANTE',
};

const MSG_DOMINIO = 'Debe usar correo institucional (@universidad.edu).';

function PantallaDestino() {
  const { state } = useLocation();
  return <p>Mis solicitudes{state?.aviso ? ` — ${state.aviso}` : ''}</p>;
}

function renderRegistro() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <AuthProvider>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/mis-solicitudes" element={<PantallaDestino />} />
          <Route path="/login" element={<p>Iniciar sesión</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function llenarFormulario(
  user,
  { correo = 'juan@universidad.edu', password = 'Password123' } = {},
) {
  await user.type(screen.getByLabelText('Código institucional'), 'U20261045');
  await user.type(screen.getByLabelText('Nombre'), 'Juan');
  await user.type(screen.getByLabelText('Apellido'), 'Pérez');
  await user.type(screen.getByLabelText('Correo institucional'), correo);
  await user.type(screen.getByLabelText('Contraseña'), password);
}

const itemChecklist = (etiqueta) => screen.getByText(etiqueta).closest('li');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('RegistroPage (AUTH-17 · CA-5, CA-8)', () => {
  it('[AUTH-17] renderiza los 5 campos, el botón deshabilitado y el enlace a login', () => {
    renderRegistro();

    expect(screen.getByLabelText('Código institucional')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute('href', '/login');
  });

  it('[AUTH-17] CA-8: el checklist de contraseña se actualiza en vivo', async () => {
    const user = userEvent.setup();
    renderRegistro();

    expect(itemChecklist('Mínimo 8 caracteres')).toHaveAttribute('data-cumple', 'false');

    await user.type(screen.getByLabelText('Contraseña'), 'Password');
    expect(itemChecklist('Mínimo 8 caracteres')).toHaveAttribute('data-cumple', 'true');
    expect(itemChecklist('Una mayúscula (A-Z, Ñ, Á…)')).toHaveAttribute('data-cumple', 'true');
    expect(itemChecklist('Un número')).toHaveAttribute('data-cumple', 'false');

    await user.type(screen.getByLabelText('Contraseña'), '1');
    expect(itemChecklist('Un número')).toHaveAttribute('data-cumple', 'true');
  });

  it('[AUTH-17] CA-8: el botón permanece deshabilitado mientras la contraseña no cumple', async () => {
    const user = userEvent.setup();
    renderRegistro();
    const boton = screen.getByRole('button', { name: 'Crear cuenta' });

    await user.type(screen.getByLabelText('Contraseña'), 'password');
    expect(boton).toBeDisabled();

    await user.type(screen.getByLabelText('Contraseña'), '1');
    expect(boton).toBeDisabled(); // sigue sin mayúscula

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'Password1');
    expect(boton).toBeEnabled();
  });

  it('[AUTH-17] CA-5: el correo no institucional bloquea el envío y muestra el mensaje', async () => {
    const user = userEvent.setup();
    let llamado = false;
    server.use(
      http.post('*/api/v1/auth/registro', () => {
        llamado = true;
        return HttpResponse.json({ token: 'no-deberia', usuario: USUARIO }, { status: 201 });
      }),
    );
    renderRegistro();

    await llenarFormulario(user, { correo: 'juan@gmail.com' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(MSG_DOMINIO)).toBeInTheDocument();
    expect(llamado).toBe(false);
    expect(screen.getByLabelText('Correo institucional')).toHaveFocus();
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('aria-invalid', 'true');
  });

  it('[AUTH-17] el error de un campo se limpia al corregirlo', async () => {
    const user = userEvent.setup();
    renderRegistro();

    await llenarFormulario(user, { correo: 'juan@gmail.com' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText(MSG_DOMINIO)).toBeInTheDocument();

    const correo = screen.getByLabelText('Correo institucional');
    await user.clear(correo);
    await user.type(correo, 'juan@universidad.edu');

    expect(screen.queryByText(MSG_DOMINIO)).not.toBeInTheDocument();
  });

  it('[AUTH-17] CA-4: el registro exitoso guarda la sesión, normaliza el correo y redirige', async () => {
    const user = userEvent.setup();
    let cuerpoRecibido = null;
    server.use(
      http.post('*/api/v1/auth/registro', async ({ request }) => {
        cuerpoRecibido = await request.json();
        return HttpResponse.json({ token: 'jwt-de-prueba', usuario: USUARIO }, { status: 201 });
      }),
    );
    renderRegistro();

    await llenarFormulario(user, { correo: 'JUAN@UNIVERSIDAD.EDU' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText((texto) => texto.includes('Cuenta creada. ¡Bienvenido/a, Juan!')),
    ).toBeInTheDocument();
    expect(cuerpoRecibido).toEqual({
      codigoInstitucional: 'U20261045',
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@universidad.edu',
      password: 'Password123',
    });

    const sesion = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(sesion.token).toBe('jwt-de-prueba');
    expect(sesion.usuario).toEqual(USUARIO);
  });

  it('[AUTH-17] CA-7: el 409 del servidor se muestra como alerta general y no guarda sesión', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/auth/registro', () =>
        HttpResponse.json(
          {
            type: 'https://api.servicios.edu/errors/conflict',
            title: 'Recurso en conflicto',
            status: 409,
            detail: 'Ya existe un usuario con ese correo electrónico',
            traceId: 'abc123',
          },
          { status: 409 },
        ),
      ),
    );
    renderRegistro();

    await llenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe un usuario con ese correo electrónico',
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText('Correo institucional')).toBeInTheDocument(); // sigue en el registro
  });

  it('[AUTH-17] un 400 del servidor con `errores` se pinta en su campo', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/v1/auth/registro', () =>
        HttpResponse.json(
          {
            type: 'https://api.servicios.edu/errors/validation',
            title: 'Datos inválidos',
            status: 400,
            detail: 'Revisa los campos marcados',
            errores: {
              codigoInstitucional: 'El código institucional ya no está disponible',
            },
            traceId: 'def456',
          },
          { status: 400 },
        ),
      ),
    );
    renderRegistro();

    await llenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('El código institucional ya no está disponible'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Código institucional')).toHaveAttribute('aria-invalid', 'true');
  });

  it('[AUTH-17] sin conexión muestra el aviso de red de UX §9', async () => {
    const user = userEvent.setup();
    server.use(http.post('*/api/v1/auth/registro', () => HttpResponse.error()));
    renderRegistro();

    await llenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
    );
  });
});
