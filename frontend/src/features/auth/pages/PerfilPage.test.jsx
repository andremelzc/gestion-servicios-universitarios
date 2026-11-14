import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Providers from '../../../app/providers.jsx';
import { server } from '../../../test/server.js';
import { STORAGE_KEY } from '../AuthContext.jsx';
import PerfilPage from './PerfilPage.jsx';

const URL_CAMBIO = '*/api/v1/auth/cambiar-password';

function renderPagina(usuario = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: 'jwt-de-prueba',
      usuario: {
        id: 1,
        nombre: 'Ana',
        apellido: 'Estudiante',
        correo: 'ana@universidad.edu',
        rol: 'ESTUDIANTE',
        idArea: null,
        ...usuario,
      },
    }),
  );
  return render(
    <MemoryRouter>
      <Providers>
        <PerfilPage />
      </Providers>
    </MemoryRouter>,
  );
}

const campo = (nombre) => screen.getByLabelText(nombre);

describe('PerfilPage', () => {
  beforeEach(() => localStorage.clear());

  it('muestra los datos de la cuenta', () => {
    renderPagina();

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument();
    expect(screen.getByText('Ana Estudiante')).toBeInTheDocument();
    expect(screen.getByText('ana@universidad.edu')).toBeInTheDocument();
    expect(screen.getByText('Estudiante')).toBeInTheDocument();
    expect(screen.getByText('Sin área')).toBeInTheDocument();
  });

  it('avisa si la confirmación no coincide y no llama a la API', async () => {
    let llamadas = 0;
    server.use(
      http.put(URL_CAMBIO, () => {
        llamadas += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.type(campo('Contraseña actual'), 'Actual123');
    await usuario.type(campo('Nueva contraseña'), 'Nueva1234');
    await usuario.type(campo('Confirmar nueva contraseña'), 'Distinta1');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(llamadas).toBe(0);
  });

  it('cambia la contraseña y confirma con un aviso', async () => {
    let cuerpo = null;
    server.use(
      http.put(URL_CAMBIO, async ({ request }) => {
        cuerpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.type(campo('Contraseña actual'), 'Actual123');
    await usuario.type(campo('Nueva contraseña'), 'Nueva1234');
    await usuario.type(campo('Confirmar nueva contraseña'), 'Nueva1234');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument();
    expect(cuerpo).toEqual({ passwordActual: 'Actual123', nuevaPassword: 'Nueva1234' });
    await waitFor(() => expect(campo('Contraseña actual')).toHaveValue(''));
  });

  it('muestra el error del servidor si la contraseña actual es incorrecta', async () => {
    server.use(
      http.put(URL_CAMBIO, () =>
        HttpResponse.json(
          { status: 400, detail: 'La contraseña actual es incorrecta' },
          { status: 400 },
        ),
      ),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.type(campo('Contraseña actual'), 'Mala1234');
    await usuario.type(campo('Nueva contraseña'), 'Nueva1234');
    await usuario.type(campo('Confirmar nueva contraseña'), 'Nueva1234');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Contraseña actualizada.')).not.toBeInTheDocument();
  });
});
