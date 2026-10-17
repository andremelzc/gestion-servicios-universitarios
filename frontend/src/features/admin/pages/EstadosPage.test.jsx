import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarAdmin } from '../../../test/handlers/admin.js';
import { problema } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import EstadosPage from './EstadosPage.jsx';

beforeEach(() => reiniciarAdmin());

async function abrirEdicion(codigo) {
  await userEvent.click(await screen.findByRole('button', { name: `Editar ${codigo}` }));
  return within(screen.getByRole('dialog', { name: /^Editar estado/ }));
}

async function escribir(campo, texto) {
  await userEvent.clear(campo);
  if (texto) await userEvent.type(campo, texto);
}

describe('EstadosPage (US-32)', () => {
  it('[US-32] lista los 6 estados sin alta, baja ni filtro de inactivos (ADR-009)', async () => {
    render(<EstadosPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administración de estados' }),
    ).toBeVisible();
    const fila = await screen.findByRole('row', { name: /EN_EVALUACION/ });
    expect(within(fila).getByText('En evaluación')).toBeVisible();
    expect(within(fila).getByText('#D97706')).toBeVisible();
    expect(screen.getAllByRole('row')).toHaveLength(7); // cabecera + 6
    expect(screen.queryByRole('button', { name: /nuev|eliminar|desactivar/i })).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('[US-32 CA-7] cambia nombre y color; el código no cambia y se anuncia el resultado', async () => {
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('EN_EVALUACION');
    await escribir(dialogo.getByLabelText('Nombre visible'), 'En revisión');
    await escribir(dialogo.getByLabelText('Color (#RRGGBB)'), '#b45309');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Estado «En revisión» actualizado. Se mostrará así en todas las pantallas.',
    );
    const fila = await screen.findByRole('row', { name: /EN_EVALUACION/ });
    expect(within(fila).getByText('En revisión')).toBeVisible();
    expect(within(fila).getByText('#B45309')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[US-32] la vista previa refleja el nombre escrito', async () => {
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    await escribir(dialogo.getByLabelText('Nombre visible'), 'Con técnico');

    expect(dialogo.getByRole('group', { name: 'Vista previa' })).toHaveTextContent('Con técnico');
  });

  it('[US-32 CA-7] avisa el poco contraste sin impedir guardar', async () => {
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    const color = dialogo.getByLabelText('Color (#RRGGBB)');
    expect(color).not.toHaveAccessibleDescription(/contraste/);

    await escribir(color, '#FFFF00');

    expect(color).toHaveAccessibleDescription(/poco contraste con el fondo blanco \(1\.1:1\)/);
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('#FFFF00')).toBeVisible();
  });

  it('[US-32 CA-7] un color inválido no se envía y recibe el foco', async () => {
    let enviado = false;
    server.use(
      http.put('*/api/v1/estados/:codigo', () => {
        enviado = true;
      }),
    );
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    const color = dialogo.getByLabelText('Color (#RRGGBB)');
    await escribir(color, 'rojo');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(color).toBeInvalid();
    expect(color).toHaveFocus();
    expect(color).toHaveAccessibleDescription(/#RRGGBB/);
    expect(enviado).toBe(false);
  });

  it('[US-32] muestra los errores por campo que devuelve el servidor', async () => {
    server.use(
      http.put('*/api/v1/estados/:codigo', () =>
        problema(400, 'validacion', 'Validación', 'Inválido', '/x', {
          errores: { nombreVisible: 'Ese nombre ya lo usa otro estado.' },
        }),
      ),
    );
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const nombre = await dialogo.findByLabelText('Nombre visible');
    expect(nombre).toBeInvalid();
    expect(nombre).toHaveAccessibleDescription('Ese nombre ya lo usa otro estado.');
  });

  it('[US-32] el error se limpia al escribir y el foco no se roba al seguir tecleando', async () => {
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    const color = dialogo.getByLabelText('Color (#RRGGBB)');
    const nombre = dialogo.getByLabelText('Nombre visible');
    await escribir(color, 'rojo');
    await escribir(nombre, '');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    expect(nombre).toHaveFocus();

    await userEvent.type(nombre, 'Con técnico');

    expect(nombre).toBeValid();
    expect(nombre).toHaveFocus();
    expect(color).toBeInvalid();
  });

  it('[US-32 CA-7] el aviso de contraste se anuncia en una región de estado cortés', async () => {
    render(<EstadosPage />);
    const dialogo = await abrirEdicion('ASIGNADA');
    const region = dialogo.getByRole('status');
    expect(region).toBeEmptyDOMElement();

    await escribir(dialogo.getByLabelText('Color (#RRGGBB)'), '#FFFF00');

    expect(region).toHaveTextContent(/poco contraste con el fondo blanco/);
  });
});
