import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import ComentariosPanel from './ComentariosPanel.jsx';

describe('ComentariosPanel', () => {
  it('permite a personal interno publicar un comentario privado', async () => {
    let enviado;
    server.use(
      http.get('*/api/v1/solicitudes/4/comentarios', () => HttpResponse.json([])),
      http.post('*/api/v1/solicitudes/4/comentarios', async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ id: 1, ...enviado }, { status: 201 });
      }),
    );
    render(<ComentariosPanel solicitudId={4} rol="TECNICO" />);
    await screen.findByText('No hay comentarios.');
    await userEvent.type(screen.getByLabelText('Comentario'), 'Ya está en revisión');
    await userEvent.click(screen.getByLabelText('Privado para el equipo'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
    await waitFor(() =>
      expect(enviado).toEqual({ comentario: 'Ya está en revisión', privado: true }),
    );
    expect(screen.getByLabelText('Comentario')).toHaveValue('');
  });

  it('rechaza etiquetas HTML y limita el comentario a 500 caracteres', async () => {
    server.use(http.get('*/api/v1/solicitudes/4/comentarios', () => HttpResponse.json([])));
    render(<ComentariosPanel solicitudId={4} rol="ESTUDIANTE" />);
    await screen.findByText('No hay comentarios.');
    const campo = screen.getByLabelText('Comentario');
    expect(campo).toHaveAttribute('maxlength', '500');
    await userEvent.type(campo, '<b>Hola</b>');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
    expect(screen.getByRole('alert')).toHaveTextContent('no debe contener etiquetas HTML');
    expect(screen.queryByRole('button', { name: 'Reintentar carga' })).not.toBeInTheDocument();
  });

  it('no ofrece comentarios privados al estudiante y muestra error de estado final', async () => {
    server.use(
      http.get('*/api/v1/solicitudes/4/comentarios', () => HttpResponse.json([])),
      http.post('*/api/v1/solicitudes/4/comentarios', () => HttpResponse.json({}, { status: 409 })),
    );
    render(<ComentariosPanel solicitudId={4} rol="ESTUDIANTE" />);
    await screen.findByText('No hay comentarios.');
    expect(screen.queryByLabelText('Privado para el equipo')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Comentario'), 'Consulta');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('solicitud finalizada');
  });
});

it('muestra los comentarios devueltos y actualiza la lista tras publicar', async () => {
  const datos = [{ id: 1, comentario: 'Solicitud recibida', privado: false }];
  server.use(
    http.get('*/api/v1/solicitudes/4/comentarios', () => HttpResponse.json(datos)),
    http.post('*/api/v1/solicitudes/4/comentarios', async ({ request }) => {
      const nuevo = await request.json();
      datos.push({ id: 2, ...nuevo });
      return HttpResponse.json(datos[1], { status: 201 });
    }),
  );
  render(<ComentariosPanel solicitudId={4} rol="ESTUDIANTE" />);
  expect(await screen.findByText('Solicitud recibida')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Comentario'), 'Gracias por la ayuda');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }));
  expect(await screen.findByText('Gracias por la ayuda')).toBeInTheDocument();
  expect(screen.getByText('Solicitud recibida')).toBeInTheDocument();
});

it('oculta el formulario si la API no permite comentar', async () => {
  server.use(
    http.get('*/api/v1/solicitudes/4/comentarios', () =>
      HttpResponse.json([{ id: 1, comentario: 'Comentario anterior', privado: false }]),
    ),
  );
  render(<ComentariosPanel solicitudId={4} rol="ESTUDIANTE" puedeComentar={false} />);
  expect(await screen.findByText('Comentario anterior')).toBeInTheDocument();
  expect(screen.queryByLabelText('Comentario')).not.toBeInTheDocument();
});

it('permite reintentar cuando falla la carga de comentarios', async () => {
  let intentos = 0;
  server.use(
    http.get('*/api/v1/solicitudes/4/comentarios', () => {
      intentos += 1;
      return intentos === 1
        ? HttpResponse.json({}, { status: 500 })
        : HttpResponse.json([{ id: 1, comentario: 'Recuperado', privado: false }]);
    }),
  );
  render(<ComentariosPanel solicitudId={4} rol="SUPERVISOR" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar');
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar carga' }));
  expect(await screen.findByText('Recuperado')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
