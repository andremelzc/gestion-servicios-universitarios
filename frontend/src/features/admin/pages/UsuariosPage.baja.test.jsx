import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarUsuarios } from '../../../test/handlers/admin.usuarios.js';
import { server } from '../../../test/server.js';
import UsuariosPage from './UsuariosPage.jsx';

beforeEach(() => reiniciarUsuarios());

const fila = async (nombre) => within(await screen.findByRole('row', { name: new RegExp(nombre) }));

async function pedirBaja(nombre) {
  await userEvent.click(await screen.findByRole('button', { name: `Desactivar ${nombre}` }));
  return within(screen.getByRole('alertdialog', { name: `Desactivar ${nombre}` }));
}

describe('UsuariosPage: desactivar y reactivar (US-34, RN-22)', () => {
  it('[US-34 CA-10] desactivar pide confirmación; al confirmar (204) la fila sale de las activas', async () => {
    render(<UsuariosPage />);
    const dialogo = await pedirBaja('Luis Gómez');

    expect(dialogo.getByText(/Los registros existentes no se modifican/)).toBeVisible();
    await userEvent.click(dialogo.getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Usuario «Luis Gómez» desactivado.',
    );
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Luis Gómez/ })).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('[US-34 CA-10] cancelar la confirmación no envía nada', async () => {
    let enviado = false;
    server.use(
      http.delete('*/api/v1/admin/usuarios/:id', () => {
        enviado = true;
      }),
    );
    render(<UsuariosPage />);
    const dialogo = await pedirBaja('Luis Gómez');

    await userEvent.click(dialogo.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(enviado).toBe(false);
    await fila('Luis Gómez');
  });

  it('[US-34 CA-10] un usuario inactivo se puede reactivar y vuelve a figurar como activo', async () => {
    render(<UsuariosPage />);
    await fila('Luis Gómez');
    await userEvent.click(screen.getByRole('checkbox', { name: /mostrar inactivas/i }));
    const pedro = await fila('Pedro Inactivo');

    expect(pedro.queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument();
    await userEvent.click(pedro.getByRole('button', { name: 'Reactivar Pedro Inactivo' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Usuario «Pedro Inactivo» reactivado.',
    );
    expect(await (await fila('Pedro Inactivo')).findByText('Activo')).toBeVisible();
  });

  it('[US-34 CA-11] desactivar al único administrador activo (409) muestra el motivo y no cambia la fila', async () => {
    render(<UsuariosPage />);
    const dialogo = await pedirBaja('Carlos Admin');

    await userEvent.click(dialogo.getByRole('button', { name: 'Desactivar' }));

    expect(await dialogo.findByRole('alert')).toHaveTextContent(
      'No se puede desactivar al único administrador activo.',
    );
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect((await fila('Carlos Admin')).getByText('Activo')).toBeVisible();
  });

  it('[US-34 CA-11] quitarle el rol al único administrador (409) se avisa en el formulario', async () => {
    render(<UsuariosPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Carlos Admin' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Editar usuario Carlos Admin' }));

    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'ESTUDIANTE');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await dialogo.findByRole('alert')).toHaveTextContent(
      'No se puede cambiar el rol del único administrador activo.',
    );
  });
});
