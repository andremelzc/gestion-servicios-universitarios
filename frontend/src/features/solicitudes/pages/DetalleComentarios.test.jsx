import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { server } from '../../../test/server.js';
import DetalleSolicitudPage from './DetalleSolicitudPage.jsx';

let rol = 'ESTUDIANTE';
vi.mock('../../auth/AuthContext.jsx', () => ({ useAuth: () => ({ usuario: { rol } }) }));

function abrirDetalle() {
  render(
    <MemoryRouter initialEntries={['/solicitudes/42']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function prepararDetalle(accionesPermitidas) {
  server.use(
    http.get('*/api/v1/solicitudes/42', () =>
      HttpResponse.json({ codigo: 'SOL-42', titulo: 'Equipo', accionesPermitidas }),
    ),
    http.get('*/api/v1/solicitudes/42/historial', () => HttpResponse.json([])),
  );
}

beforeEach(() => {
  rol = 'ESTUDIANTE';
});

it('muestra comentarios y permite publicar un comentario público desde el detalle', async () => {
  prepararDetalle(['COMENTAR']);
  const comentarios = [
    {
      id: 1,
      comentario: 'En revisión',
      usuario: 'Ana Torres',
      fechaComentario: '2026-10-03T15:04:00',
      privado: false,
    },
  ];
  let cuerpo;
  server.use(
    http.get('*/api/v1/solicitudes/42/comentarios', () => HttpResponse.json(comentarios)),
    http.post('*/api/v1/solicitudes/42/comentarios', async ({ request }) => {
      cuerpo = await request.json();
      comentarios.push({
        id: 2,
        ...cuerpo,
        usuario: 'Juan Pérez',
        fechaComentario: '2026-10-03T16:00:00',
      });
      return HttpResponse.json(comentarios[1], { status: 201 });
    }),
  );
  abrirDetalle();
  expect(await screen.findByText('En revisión')).toBeInTheDocument();
  expect(screen.getByText('Ana Torres')).toBeInTheDocument();
  expect(screen.getByText(/10:04/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Privado para el equipo')).not.toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Comentario'), 'Gracias por la ayuda');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
  expect(await screen.findByText('Gracias por la ayuda')).toBeInTheDocument();
  expect(cuerpo).toEqual({ comentario: 'Gracias por la ayuda', privado: false });
});

it('muestra comentarios existentes pero no el formulario cuando no está permitida la acción', async () => {
  prepararDetalle([]);
  server.use(
    http.get('*/api/v1/solicitudes/42/comentarios', () =>
      HttpResponse.json([{ id: 1, comentario: 'Cerrada', usuario: 'Ana Torres', privado: false }]),
    ),
  );
  abrirDetalle();
  expect(await screen.findByText('Cerrada')).toBeInTheDocument();
  expect(screen.queryByLabelText('Comentario')).not.toBeInTheDocument();
});

it('permite al técnico enviar un comentario privado', async () => {
  rol = 'TECNICO';
  prepararDetalle(['COMENTAR']);
  let cuerpo;
  server.use(
    http.get('*/api/v1/solicitudes/42/comentarios', () => HttpResponse.json([])),
    http.post('*/api/v1/solicitudes/42/comentarios', async ({ request }) => {
      cuerpo = await request.json();
      return HttpResponse.json({ id: 5, ...cuerpo }, { status: 201 });
    }),
  );
  abrirDetalle();
  await userEvent.type(await screen.findByLabelText('Comentario'), 'Revisar cable');
  await userEvent.click(screen.getByLabelText('Privado para el equipo'));
  await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
  await vi.waitFor(() => expect(cuerpo).toEqual({ comentario: 'Revisar cable', privado: true }));
});
