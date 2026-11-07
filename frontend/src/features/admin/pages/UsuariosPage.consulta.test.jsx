import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarUsuarios } from '../../../test/handlers/admin.usuarios.js';
import { paginaDe } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import UsuariosPage from './UsuariosPage.jsx';

beforeEach(() => reiniciarUsuarios());

// Registra la consulta de cada GET y deja que responda el handler base (devolver `undefined`).
function espiarListado() {
  const consultas = [];
  server.use(
    http.get('*/api/v1/admin/usuarios', ({ request }) => {
      consultas.push(new URL(request.url).searchParams);
    }),
  );
  return consultas;
}

const ultima = (consultas) => consultas[consultas.length - 1];

describe('UsuariosPage: consulta enviada a /admin/usuarios (api-rest §3.6)', () => {
  it('[US-34] por defecto pide solo activos, 20 por página y sin filtros de rol ni área', async () => {
    const consultas = espiarListado();
    render(<UsuariosPage />);

    await screen.findByRole('row', { name: /Luis Gómez/ });

    const params = consultas[0];
    expect(params.get('activo')).toBe('true');
    expect(params.get('page')).toBe('0');
    expect(params.get('size')).toBe('20');
    expect(params.has('rol')).toBe(false);
    expect(params.has('idArea')).toBe(false);
  });

  it('[US-17] los filtros de rol y área viajan como `rol` e `idArea`', async () => {
    const consultas = espiarListado();
    render(<UsuariosPage />);
    await screen.findByRole('row', { name: /Luis Gómez/ });

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'TECNICO');
    await userEvent.selectOptions(await screen.findByLabelText('Área'), 'Infraestructura');

    await waitFor(() => expect(ultima(consultas).get('idArea')).toBe('2'));
    expect(ultima(consultas).get('rol')).toBe('TECNICO');
    expect(ultima(consultas).get('activo')).toBe('true');
  });

  it('[US-34 CA-14] con "Mostrar inactivas" se omite `activo`', async () => {
    const consultas = espiarListado();
    render(<UsuariosPage />);
    await screen.findByRole('row', { name: /Luis Gómez/ });

    await userEvent.click(screen.getByRole('checkbox', { name: /mostrar inactivas/i }));

    await waitFor(() => expect(ultima(consultas).has('activo')).toBe(false));
  });

  it('[US-34 CA-14] la búsqueda viaja como `q`', async () => {
    const consultas = espiarListado();
    render(<UsuariosPage />);
    await screen.findByRole('row', { name: /Luis Gómez/ });

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar/i }), 'marta');

    await waitFor(() => expect(ultima(consultas).get('q')).toBe('marta'));
  });

  it('[US-34 CA-14] cambiar un filtro vuelve a la página 0', async () => {
    const consultas = [];
    const usuario = (id) => ({
      id,
      codigoInstitucional: `U2026${id}`,
      nombre: `Persona${id}`,
      apellido: 'Prueba',
      correo: `p${id}@universidad.edu`,
      telefono: null,
      rol: 'ESTUDIANTE',
      idArea: null,
      activo: true,
    });
    server.use(
      http.get('*/api/v1/admin/usuarios', ({ request }) => {
        const params = new URL(request.url).searchParams;
        consultas.push(params);
        const page = Number(params.get('page'));
        return HttpResponse.json(
          paginaDe([usuario(page + 1)], { page, totalElements: 2, totalPages: 2 }),
        );
      }),
    );
    render(<UsuariosPage />);
    await screen.findByRole('row', { name: /Persona1/ });

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByRole('row', { name: /Persona2/ });
    expect(ultima(consultas).get('page')).toBe('1');

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'ESTUDIANTE');

    await screen.findByRole('row', { name: /Persona1/ });
    expect(ultima(consultas).get('page')).toBe('0');
    expect(ultima(consultas).get('rol')).toBe('ESTUDIANTE');
  });
});
