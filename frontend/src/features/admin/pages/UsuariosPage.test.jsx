import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarUsuarios } from '../../../test/handlers/admin.usuarios.js';
import { renderizarUsuarios } from '../../../test/renderUsuarios.jsx';

beforeEach(() => reiniciarUsuarios());

const fila = async (nombre) => within(await screen.findByRole('row', { name: new RegExp(nombre) }));

describe('UsuariosPage: listado y filtros (US-17, US-34)', () => {
  it('[US-34] lista los usuarios activos con rol y área, sin los inactivos', async () => {
    renderizarUsuarios();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Administración de usuarios' }),
    ).toBeVisible();
    const tecnico = await fila('Luis Gómez');
    expect(tecnico.getByRole('cell', { name: 'Técnico' })).toBeVisible();
    expect(
      await tecnico.findByRole('cell', { name: 'Tecnología de la Información' }),
    ).toBeVisible();
    const estudiante = await fila('Ana Rojas');
    expect(estudiante.getByRole('cell', { name: 'Estudiante' })).toBeVisible();
    expect(screen.queryByRole('row', { name: /Pedro Inactivo/ })).not.toBeInTheDocument();
  });

  it('[US-34] "Mostrar inactivas" incluye a los usuarios dados de baja', async () => {
    renderizarUsuarios();
    await fila('Luis Gómez');

    await userEvent.click(screen.getByRole('checkbox', { name: /mostrar inactivas/i }));

    const inactivo = await fila('Pedro Inactivo');
    expect(inactivo.getByText('Inactivo')).toBeVisible();
  });

  it('[US-17] filtra por rol', async () => {
    renderizarUsuarios();
    await fila('Luis Gómez');

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'ESTUDIANTE');

    await fila('Ana Rojas');
    expect(screen.queryByRole('row', { name: /Luis Gómez/ })).not.toBeInTheDocument();
  });

  it('[US-17] filtra por área', async () => {
    renderizarUsuarios();
    await fila('Luis Gómez');

    await userEvent.selectOptions(await screen.findByLabelText('Área'), 'Infraestructura');

    await fila('Marta Díaz');
    expect(screen.queryByRole('row', { name: /Luis Gómez/ })).not.toBeInTheDocument();
  });

  it('[US-34] busca por nombre o correo con la caja de búsqueda', async () => {
    renderizarUsuarios();
    await fila('Luis Gómez');

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar/i }), 'marta');

    // La búsqueda se aplica tras el debounce de `useCrud`.
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Luis Gómez/ })).not.toBeInTheDocument(),
    );
    await fila('Marta Díaz');
  });
});
