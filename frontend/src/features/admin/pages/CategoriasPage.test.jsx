import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../services/apiClient.js';
import { problema } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import CategoriasPage from './CategoriasPage.jsx';
import { esperarOpcion, seleccionar } from '../../../test/seleccionar.js';

const fila = async (nombre) => within(await screen.findByRole('row', { name: new RegExp(nombre) }));

async function abrirEdicion(nombre) {
  await userEvent.click(await screen.findByRole('button', { name: `Editar ${nombre}` }));
  return screen.getByRole('dialog', { name: `Editar categoría ${nombre}` });
}

async function abrirAlta() {
  await userEvent.click(await screen.findByRole('button', { name: 'Nueva categoría' }));
  const dialogo = within(screen.getByRole('dialog', { name: 'Nueva categoría' }));
  // El selector de área se llena con `GET /areas`: se espera a que esté la opción.
  await esperarOpcion(dialogo.getByLabelText('Área responsable'), 'Infraestructura');
  return dialogo;
}

describe('CategoriasPage (US-15)', () => {
  it('[US-15] lista las categorías activas con su área y su SLA', async () => {
    render(<CategoriasPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administración de categorías' }),
    ).toBeVisible();
    const mobiliario = await fila('Mobiliario');
    expect(mobiliario.getByRole('cell', { name: 'Infraestructura' })).toBeVisible();
    expect(mobiliario.getByRole('cell', { name: '48' })).toBeVisible();
    expect(await screen.findAllByRole('row')).toHaveLength(3); // cabecera + 2
  });

  it('[UAT-09] crea una categoría con su área y la anuncia en la lista', async () => {
    render(<CategoriasPage />);
    const dialogo = await abrirAlta();
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Pizarras Interactivas');
    await seleccionar(userEvent, dialogo.getByLabelText('Área responsable'), '2');
    await userEvent.type(dialogo.getByLabelText('SLA estándar (horas)'), '36');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Categoría «Pizarras Interactivas» creada.',
    );
    const nueva = await fila('Pizarras Interactivas');
    expect(nueva.getByRole('cell', { name: 'Infraestructura' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[US-15] editar actualiza la fila y precarga los valores', async () => {
    render(<CategoriasPage />);
    const dialogo = within(await abrirEdicion('Mobiliario'));
    await esperarOpcion(dialogo.getByLabelText('Área responsable'), 'Infraestructura');

    expect(dialogo.getByLabelText('Nombre')).toHaveValue('Mobiliario');
    const sla = dialogo.getByLabelText('SLA estándar (horas)');
    expect(sla).toHaveValue(48);
    await userEvent.clear(sla);
    await userEvent.type(sla, '12');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Categoría «Mobiliario» actualizada.',
    );
    expect(await (await fila('Mobiliario')).findByRole('cell', { name: '12' })).toBeVisible();
  });

  it('[US-15] valida en el cliente: sin nombre no se envía y se marca el campo', async () => {
    let enviado = false;
    server.use(
      http.post('*/api/v1/categorias', () => {
        enviado = true;
      }),
    );
    render(<CategoriasPage />);
    const dialogo = await abrirAlta();
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const nombre = dialogo.getByLabelText('Nombre');
    expect(nombre).toBeInvalid();
    expect(nombre).toHaveFocus();
    expect(nombre).toHaveAccessibleDescription('Ingresa el nombre de la categoría.');
    expect(dialogo.getByLabelText('Área responsable')).toBeInvalid();
    expect(enviado).toBe(false);
  });

  it('[US-15] un 409 sin campo (nombre repetido) se asocia al campo Nombre', async () => {
    render(<CategoriasPage />);
    const dialogo = await abrirAlta();
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Mobiliario');
    await seleccionar(userEvent, dialogo.getByLabelText('Área responsable'), '2');
    await userEvent.type(dialogo.getByLabelText('SLA estándar (horas)'), '10');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const nombre = await dialogo.findByLabelText('Nombre');
    expect(nombre).toBeInvalid();
    expect(nombre).toHaveFocus();
    expect(nombre).toHaveAccessibleDescription('Ya existe una categoría con ese nombre.');
    expect(dialogo.queryByRole('alert')).toBeNull();
  });

  it('[US-15] un 409 al editar también se asocia al campo Nombre', async () => {
    render(<CategoriasPage />);
    const dialogo = within(await abrirEdicion('Mobiliario'));
    await esperarOpcion(dialogo.getByLabelText('Área responsable'), 'Infraestructura');
    const nombre = dialogo.getByLabelText('Nombre');
    await userEvent.clear(nombre);
    await userEvent.type(nombre, 'Equipos de Cómputo');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(nombre).toBeInvalid());
    expect(nombre).toHaveAccessibleDescription('Ya existe una categoría con ese nombre.');
  });

  it('[US-15] un área renombrada se ve con su nombre nuevo en las categorías', async () => {
    await apiClient.put('/areas/2', {
      nombre: 'Mantenimiento e Infraestructura',
      correoContacto: 'infra@universidad.edu',
    });
    render(<CategoriasPage />);

    const mobiliario = await fila('Mobiliario');
    expect(mobiliario.getByRole('cell', { name: 'Mantenimiento e Infraestructura' })).toBeVisible();
  });

  it('[US-15] un 400 con campo se asocia a ese campo', async () => {
    server.use(
      http.post('*/api/v1/categorias', () =>
        problema(400, 'validacion', 'V', 'Inválido', '/x', {
          errores: { tiempoSlaHoras: 'El SLA no puede superar 720 horas.' },
        }),
      ),
    );
    render(<CategoriasPage />);
    const dialogo = await abrirAlta();
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Otra');
    await seleccionar(userEvent, dialogo.getByLabelText('Área responsable'), '1');
    await userEvent.type(dialogo.getByLabelText('SLA estándar (horas)'), '10');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await dialogo.findByLabelText('SLA estándar (horas)')).toHaveAccessibleDescription(
      /720 horas/,
    );
  });

  it('[US-15] desactivar pide confirmación; cancelar no cambia nada', async () => {
    render(<CategoriasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar Mobiliario' }));
    const confirmacion = within(screen.getByRole('alertdialog', { name: 'Desactivar Mobiliario' }));
    await userEvent.click(confirmacion.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(await fila('Mobiliario')).toBeTruthy();
  });

  it('[UAT-09 / RN-14] desactivar la quita de la lista y "Mostrar inactivas" permite reactivarla', async () => {
    render(<CategoriasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar Mobiliario' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Categoría «Mobiliario» desactivada.',
    );
    await waitFor(() => expect(screen.queryByRole('row', { name: /Mobiliario/ })).toBeNull());

    await userEvent.click(screen.getByRole('checkbox', { name: 'Mostrar inactivas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar Mobiliario' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Categoría «Mobiliario» reactivada.',
    );
    expect(await screen.findByRole('button', { name: 'Desactivar Mobiliario' })).toBeVisible();
  });

  it('[US-15] si no cargan las áreas, el modal lo avisa y no se puede guardar sin área', async () => {
    let enviado = false;
    server.use(
      http.get('*/api/v1/areas', () => problema(500, 'interno', 'E', 'Falla', '/areas')),
      http.post('*/api/v1/categorias', () => {
        enviado = true;
      }),
    );
    render(<CategoriasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva categoría' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva categoría' }));
    expect(await dialogo.findByText('No se pudieron cargar las áreas.')).toBeVisible();

    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Otra');
    await userEvent.type(dialogo.getByLabelText('SLA estándar (horas)'), '10');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(dialogo.getByLabelText('Área responsable')).toBeInvalid();
    expect(dialogo.getByLabelText('Área responsable')).toHaveAccessibleDescription(
      'Selecciona el área responsable.',
    );
    expect(enviado).toBe(false);
  });
});
