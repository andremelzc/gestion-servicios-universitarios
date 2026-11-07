import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AreasPage from './AreasPage.jsx';

const fila = async (nombre) => within(await screen.findByRole('row', { name: new RegExp(nombre) }));

describe('AreasPage (US-16, US-33)', () => {
  it('[US-16] lista las áreas activas con su correo de contacto', async () => {
    render(<AreasPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administración de áreas' }),
    ).toBeVisible();
    expect(
      (await fila('Infraestructura')).getByRole('cell', { name: 'infra@universidad.edu' }),
    ).toBeVisible();
    expect(await screen.findAllByRole('row')).toHaveLength(3); // cabecera + 2
  });

  it('[US-16] un 409 al crear (nombre repetido) se asocia al campo Nombre', async () => {
    render(<AreasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva área' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva área' }));
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'infraestructura');
    await userEvent.type(dialogo.getByLabelText('Correo de contacto'), 'otra@universidad.edu');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const nombre = await dialogo.findByLabelText('Nombre');
    await waitFor(() => expect(nombre).toBeInvalid());
    expect(nombre).toHaveAccessibleDescription('Ya existe un área con ese nombre.');
  });

  it('[US-16] crea un área y la anuncia', async () => {
    render(<AreasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva área' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva área' }));
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Servicios Generales');
    await userEvent.type(dialogo.getByLabelText('Correo de contacto'), 'generales@universidad.edu');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Área «Servicios Generales» creada.',
    );
    expect(await fila('Servicios Generales')).toBeTruthy();
  });

  it('[US-16] valida el correo en el cliente y marca el campo', async () => {
    render(<AreasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva área' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva área' }));
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Otra');
    await userEvent.type(dialogo.getByLabelText('Correo de contacto'), 'sin-arroba');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const correo = dialogo.getByLabelText('Correo de contacto');
    expect(correo).toBeInvalid();
    expect(correo).toHaveFocus();
    expect(correo).toHaveAccessibleDescription('Ingresa un correo válido.');
  });

  it('[US-16] editar actualiza la fila y el 409 de nombre repetido se muestra en el modal', async () => {
    render(<AreasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Infraestructura' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Editar área Infraestructura' }));
    const correo = dialogo.getByLabelText('Correo de contacto');
    await userEvent.clear(correo);
    await userEvent.type(correo, 'nuevo@universidad.edu');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Área «Infraestructura» actualizada.',
    );
    expect(
      await (await fila('Infraestructura')).findByRole('cell', { name: 'nuevo@universidad.edu' }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Editar Infraestructura' }));
    const repetida = within(screen.getByRole('dialog', { name: 'Editar área Infraestructura' }));
    const nombre = repetida.getByLabelText('Nombre');
    await userEvent.clear(nombre);
    await userEvent.type(nombre, 'Tecnología de la Información');
    await userEvent.click(repetida.getByRole('button', { name: 'Guardar' }));

    const nombreRepetido = await repetida.findByLabelText('Nombre');
    await waitFor(() => expect(nombreRepetido).toBeInvalid());
    expect(nombreRepetido).toHaveFocus();
    expect(nombreRepetido).toHaveAccessibleDescription('Ya existe un área con ese nombre.');
    expect(repetida.queryByRole('alert')).toBeNull();
  });

  it('[US-16 / RN-14] desactivar pide confirmación y la reactivación vuelve a mostrarla', async () => {
    render(<AreasPage />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Desactivar Infraestructura' }),
    );
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Área «Infraestructura» desactivada.',
    );
    await waitFor(() => expect(screen.queryByRole('row', { name: /Infraestructura/ })).toBeNull());
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mostrar inactivas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar Infraestructura' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Área «Infraestructura» reactivada.',
    );
  });

  it('[US-16] un área con usuarios activos no se desactiva: el 409 se muestra en la confirmación', async () => {
    render(<AreasPage />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Desactivar Tecnología de la Información' }),
    );
    const confirmacion = within(screen.getByRole('alertdialog'));
    await userEvent.click(confirmacion.getByRole('button', { name: 'Desactivar' }));

    expect(await confirmacion.findByRole('alert')).toHaveTextContent(
      'No se puede desactivar un área con usuarios activos.',
    );
    expect(await fila('Tecnología de la Información')).toBeTruthy();
  });
});
