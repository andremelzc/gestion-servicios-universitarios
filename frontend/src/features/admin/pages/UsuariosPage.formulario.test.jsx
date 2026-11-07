import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarUsuarios } from '../../../test/handlers/admin.usuarios.js';
import { problema } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import UsuariosPage from './UsuariosPage.jsx';

beforeEach(() => reiniciarUsuarios());

const fila = async (nombre) => within(await screen.findByRole('row', { name: new RegExp(nombre) }));

async function abrirAlta() {
  await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
  return within(screen.getByRole('dialog', { name: 'Nuevo usuario' }));
}

async function abrirEdicion(nombre) {
  await userEvent.click(await screen.findByRole('button', { name: `Editar ${nombre}` }));
  return within(screen.getByRole('dialog', { name: `Editar usuario ${nombre}` }));
}

async function completarAlta(
  dialogo,
  { correo = 'lucia@universidad.edu', rol = 'ESTUDIANTE' } = {},
) {
  await userEvent.type(dialogo.getByLabelText('Código institucional'), 'U20260010');
  await userEvent.type(dialogo.getByLabelText('Nombre'), 'Lucía');
  await userEvent.type(dialogo.getByLabelText('Apellido'), 'Pérez');
  await userEvent.type(dialogo.getByLabelText('Correo'), correo);
  await userEvent.type(dialogo.getByLabelText('Contraseña inicial'), 'Segura123');
  await userEvent.selectOptions(dialogo.getByLabelText('Rol'), rol);
}

describe('UsuariosPage: alta y edición (US-17, US-34)', () => {
  it('[US-34 CA-9] crea un supervisor del área TI: lo envía con su área y aparece en el listado', async () => {
    let cuerpo;
    server.use(
      // Sin respuesta: MSW sigue con el handler base y solo se captura el cuerpo enviado.
      http.post('*/api/v1/admin/usuarios', async ({ request }) => {
        cuerpo = await request.clone().json();
      }),
    );
    render(<UsuariosPage />);
    await fila('Luis Gómez');
    const dialogo = await abrirAlta();

    await completarAlta(dialogo, { rol: 'SUPERVISOR' });
    await userEvent.selectOptions(
      await dialogo.findByLabelText('Área'),
      'Tecnología de la Información',
    );
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuario «Lucía Pérez» creado.');
    expect((await fila('Lucía Pérez')).getByRole('cell', { name: 'Supervisor' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cuerpo).toMatchObject({ rol: 'SUPERVISOR', idArea: 1, correo: 'lucia@universidad.edu' });
    // Teclea seis campos: con la suite en paralelo supera los 5 s por defecto.
  }, 15000);

  it('[US-17 CA-8] el campo Área aparece solo para TECNICO y SUPERVISOR (RN-21)', async () => {
    render(<UsuariosPage />);
    const dialogo = await abrirAlta();

    expect(dialogo.queryByLabelText('Área')).not.toBeInTheDocument();
    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'TECNICO');
    expect(await dialogo.findByLabelText('Área')).toBeVisible();
    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'ADMIN');
    expect(dialogo.queryByLabelText('Área')).not.toBeInTheDocument();
  });

  it('[US-17 CA-8] promover a técnico sin área no se envía y marca el campo; con área se guarda', async () => {
    let enviado = false;
    server.use(
      http.put('*/api/v1/admin/usuarios/:id', () => {
        enviado = true;
      }),
    );
    render(<UsuariosPage />);
    const dialogo = await abrirEdicion('Ana Rojas');

    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'TECNICO');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const area = await dialogo.findByLabelText('Área');
    expect(area).toBeInvalid();
    expect(area).toHaveFocus();
    expect(dialogo.getByText('Selecciona el área: es obligatoria para este rol.')).toBeVisible();
    expect(enviado).toBe(false);
  });

  it('[US-17 CA-8] con área, el rol queda actualizado en la fila', async () => {
    render(<UsuariosPage />);
    const dialogo = await abrirEdicion('Ana Rojas');

    await userEvent.selectOptions(dialogo.getByLabelText('Rol'), 'TECNICO');
    await userEvent.selectOptions(await dialogo.findByLabelText('Área'), 'Infraestructura');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuario «Ana Rojas» actualizado.');
    const ana = await fila('Ana Rojas');
    expect(await ana.findByRole('cell', { name: 'Técnico' })).toBeVisible();
    expect(ana.getByRole('cell', { name: 'Infraestructura' })).toBeVisible();
  });

  it('[US-34] al editar, el código y el correo no se pueden cambiar y no hay contraseña', async () => {
    render(<UsuariosPage />);
    const dialogo = await abrirEdicion('Luis Gómez');

    expect(dialogo.getByLabelText('Código institucional')).toHaveAttribute('readonly');
    expect(dialogo.getByLabelText('Correo')).toHaveAttribute('readonly');
    expect(dialogo.queryByLabelText('Contraseña inicial')).not.toBeInTheDocument();
    expect(dialogo.getByLabelText('Nombre')).toHaveValue('Luis');
  });

  it('[US-34 CA-9] un correo de otro dominio no se envía y se marca en el cliente', async () => {
    let enviado = false;
    server.use(
      http.post('*/api/v1/admin/usuarios', () => {
        enviado = true;
      }),
    );
    render(<UsuariosPage />);
    const dialogo = await abrirAlta();

    await completarAlta(dialogo, { correo: 'lucia@gmail.com' });
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    const correo = dialogo.getByLabelText('Correo');
    expect(correo).toBeInvalid();
    expect(dialogo.getByText('Debe usar correo institucional (@universidad.edu).')).toBeVisible();
    expect(enviado).toBe(false);
  });

  it('[US-34 CA-9] un correo repetido (409) muestra el aviso y deja el formulario abierto', async () => {
    render(<UsuariosPage />);
    const dialogo = await abrirAlta();

    await completarAlta(dialogo, { correo: 'ana.rojas@universidad.edu' });
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await dialogo.findByRole('alert')).toHaveTextContent(
      'Ya existe un usuario con ese correo.',
    );
    expect(screen.getByRole('dialog', { name: 'Nuevo usuario' })).toBeVisible();
  });

  it('[US-17 CA-8] un 400 del servidor con errores.idArea se muestra en el campo Área', async () => {
    server.use(
      http.put('*/api/v1/admin/usuarios/:id', ({ request }) =>
        problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', request.url, {
          errores: { idArea: 'El área es obligatoria para el rol TECNICO.' },
        }),
      ),
    );
    render(<UsuariosPage />);
    const dialogo = await abrirEdicion('Luis Gómez');

    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await dialogo.findByLabelText('Área')).toBeInvalid();
    expect(dialogo.getByText('El área es obligatoria para el rol TECNICO.')).toBeVisible();
  });
});
