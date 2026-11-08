import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarUsuarios } from '../../../test/handlers/admin.usuarios.js';
import { problema } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import { renderizarUsuarios } from '../../../test/renderUsuarios.jsx';

beforeEach(() => reiniciarUsuarios());

const areasCaidas = () =>
  http.get(
    '*/api/v1/areas',
    ({ request }) => problema(500, 'interno', 'Error', 'Fallo.', request.url),
    { once: true },
  );

describe('UsuariosPage: fallo al cargar las áreas', () => {
  it('[US-17] avisa con role="alert" y permite reintentar; al recuperarse aparece el filtro de área', async () => {
    server.use(areasCaidas());
    renderizarUsuarios();

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('No se pudieron cargar las áreas');
    expect(screen.queryByLabelText('Área')).not.toBeInTheDocument();

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByLabelText('Área')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('[US-17 CA-8] sin áreas por el error, TECNICO y SUPERVISOR no se pueden guardar y se explica por qué', async () => {
    server.use(areasCaidas());
    renderizarUsuarios();
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nuevo usuario' }));

    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'TECNICO');

    expect(dialogo.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    expect(dialogo.getByText(/no se pudieron cargar las áreas/i)).toBeVisible();

    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'ESTUDIANTE');

    expect(dialogo.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('[US-17] desde el formulario también se puede reintentar la carga de áreas', async () => {
    server.use(areasCaidas());
    renderizarUsuarios();
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nuevo usuario' }));
    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'SUPERVISOR');

    await userEvent.click(dialogo.getByRole('button', { name: 'Reintentar' }));

    expect(await dialogo.findByLabelText('Área')).toBeVisible();
    expect(dialogo.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });
});
