import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { problema } from '../../../test/handlers/gestion.js';
import { reiniciarAdmin } from '../../../test/handlers/admin.js';
import { server } from '../../../test/server.js';
import PrioridadesPage from './PrioridadesPage.jsx';

beforeEach(() => reiniciarAdmin());

const fila = async (nivel) => within(await screen.findByRole('row', { name: new RegExp(nivel) }));

async function abrirEdicion(nivel) {
  await userEvent.click(await screen.findByRole('button', { name: `Editar ${nivel}` }));
  return screen.getByRole('dialog', { name: `Editar prioridad ${nivel}` });
}

describe('PrioridadesPage (US-31)', () => {
  it('[US-31] lista las prioridades activas con su SLA (las 4 sembradas)', async () => {
    render(<PrioridadesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administración de prioridades' }),
    ).toBeVisible();
    expect(await (await fila('ALTA')).findByRole('cell', { name: '24' })).toBeVisible();
    expect(await screen.findAllByRole('row')).toHaveLength(5); // cabecera + 4
  });

  it('[US-31 CA-6] editar el SLA avisa que no es retroactivo y actualiza la fila', async () => {
    render(<PrioridadesPage />);
    const dialogo = within(await abrirEdicion('ALTA'));

    expect(dialogo.getByText(/solo a las solicitudes nuevas/i)).toBeVisible();
    const sla = dialogo.getByLabelText('SLA máximo (horas)');
    await userEvent.clear(sla);
    await userEvent.type(sla, '12');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Prioridad «ALTA» actualizada.');
    expect(await (await fila('ALTA')).findByRole('cell', { name: '12' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[US-31] valida en el cliente: SLA 0 no se envía y se marca el campo', async () => {
    let enviado = false;
    server.use(
      http.put('*/api/v1/prioridades/:id', () => {
        enviado = true;
      }),
    );
    render(<PrioridadesPage />);
    const dialogo = within(await abrirEdicion('ALTA'));
    const sla = dialogo.getByLabelText('SLA máximo (horas)');
    await userEvent.clear(sla);
    await userEvent.type(sla, '0');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(sla).toBeInvalid();
    expect(sla).toHaveFocus();
    expect(sla).toHaveAccessibleDescription(/mayor que 0/);
    expect(enviado).toBe(false);
  });

  it('[US-31] crea una prioridad y anuncia el resultado', async () => {
    render(<PrioridadesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva prioridad' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva prioridad' }));
    await userEvent.type(dialogo.getByLabelText('Nivel'), 'URGENTE');
    await userEvent.type(dialogo.getByLabelText('Urgencia'), '5');
    await userEvent.type(dialogo.getByLabelText('SLA máximo (horas)'), '2');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Prioridad «URGENTE» creada.');
    expect(await fila('URGENTE')).toBeTruthy();
  });

  it('[US-31] muestra los errores del servidor: por campo (400) y generales (409)', async () => {
    render(<PrioridadesPage />);
    server.use(
      http.put('*/api/v1/prioridades/:id', () =>
        problema(400, 'validacion', 'Validación', 'Inválido', '/x', {
          errores: { slaMaxHoras: 'El SLA no puede superar 720 horas.' },
        }),
      ),
    );
    const dialogo = within(await abrirEdicion('ALTA'));
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const sla = await dialogo.findByLabelText('SLA máximo (horas)');
    expect(sla).toHaveAccessibleDescription(/720 horas/);

    server.use(
      http.put('*/api/v1/prioridades/:id', () =>
        problema(409, 'conflicto', 'C', 'Ya existe una prioridad con ese nivel.', '/x'),
      ),
    );
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    expect(await dialogo.findByRole('alert')).toHaveTextContent(
      'Ya existe una prioridad con ese nivel.',
    );
  });

  it('[US-31] desactivar pide confirmación; cancelar no cambia nada', async () => {
    render(<PrioridadesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar BAJA' }));
    const confirmacion = within(screen.getByRole('alertdialog', { name: 'Desactivar BAJA' }));
    await userEvent.click(confirmacion.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(await fila('BAJA')).toBeTruthy();
  });

  it('[US-31] desactivar y reactivar actualizan el listado', async () => {
    render(<PrioridadesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar BAJA' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Prioridad «BAJA» desactivada.');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mostrar inactivas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar BAJA' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Prioridad «BAJA» reactivada.');
    expect(await screen.findByRole('button', { name: 'Desactivar BAJA' })).toBeVisible();
  });
});
