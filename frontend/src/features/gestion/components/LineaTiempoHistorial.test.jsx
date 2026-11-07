import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { historialEjemplo as HISTORIAL } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import LineaTiempoHistorial from './LineaTiempoHistorial.jsx';

const responder = (cuerpo, init) =>
  server.use(http.get('*/api/v1/solicitudes/:id/historial', () => HttpResponse.json(cuerpo, init)));

describe('LineaTiempoHistorial', () => {
  it('mientras carga avisa con role=status y marca la región como ocupada', () => {
    server.use(http.get('*/api/v1/solicitudes/:id/historial', () => new Promise(() => {})));
    render(<LineaTiempoHistorial idSolicitud={150} />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando historial');
    expect(screen.getByRole('region', { name: 'Historial' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('con el handler por defecto de MSW muestra el historial del contrato', async () => {
    render(<LineaTiempoHistorial idSolicitud={150} />);
    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
  });

  it('renderiza una lista ordenada (<ol>) con un <li> por evento', async () => {
    responder(HISTORIAL);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    const lista = await screen.findByRole('list');
    expect(lista.tagName).toBe('OL');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('region', { name: 'Historial' })).not.toHaveAttribute('aria-busy');
  });

  it('muestra estado (EstadoBadge), actor, hora local de Lima y nota de cada evento', async () => {
    responder(HISTORIAL);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    const items = await screen.findAllByRole('listitem');

    expect(within(items[0]).getByText('Registrada')).toBeInTheDocument();
    expect(within(items[0]).getByText('Juan Pérez')).toBeInTheDocument();
    const hora = within(items[0]).getByText(/03\/10\/2026/);
    expect(hora.tagName).toBe('TIME');
    expect(hora).toHaveAttribute('datetime', '2026-10-03T15:04:05Z');
    // 15:04 UTC = 10:04 en America/Lima (UTC-5).
    expect(hora).toHaveTextContent('10:04');

    expect(within(items[2]).getByText('Asignada')).toBeInTheDocument();
    expect(within(items[2]).getByText('Asignada a Carlos Ruiz')).toBeInTheDocument();
    expect(within(items[1]).queryByText('Asignada a Carlos Ruiz')).not.toBeInTheDocument();
  });

  it('indica el estado anterior solo cuando existe', async () => {
    responder(HISTORIAL);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    const items = await screen.findAllByRole('listitem');
    expect(within(items[0]).queryByText(/Desde/)).not.toBeInTheDocument();
    expect(within(items[1]).getByText(/Desde.*Registrada/)).toBeInTheDocument();
    expect(within(items[2]).getByText(/Desde.*En evaluación/)).toBeInTheDocument();
  });

  it('ordena cronológicamente (más antiguo primero) aunque el API los entregue desordenados', async () => {
    responder([HISTORIAL[1], HISTORIAL[0]]);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Juan Pérez');
    expect(items[1]).toHaveTextContent('Ana Torres');
  });

  it('con el mismo instante conserva el orden del API', async () => {
    responder([HISTORIAL[1], HISTORIAL[2]]);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('En evaluación');
    expect(items[1]).toHaveTextContent('Asignada a Carlos Ruiz');
  });

  it('con un historial vacío explica que aún no hay movimientos', async () => {
    responder([]);
    render(<LineaTiempoHistorial idSolicitud={150} />);
    expect(await screen.findByText(/aún no tiene movimientos/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ante un error muestra role=alert y "Reintentar" vuelve a pedir el historial', async () => {
    const usuario = userEvent.setup();
    let llamadas = 0;
    server.use(
      http.get('*/api/v1/solicitudes/:id/historial', () => {
        llamadas += 1;
        return llamadas === 1
          ? HttpResponse.json({ status: 500 }, { status: 500 })
          : HttpResponse.json(HISTORIAL);
      }),
    );
    render(<LineaTiempoHistorial idSolicitud={150} />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(llamadas).toBe(2);
  });

  it('con 404 o 403 explica el motivo y no ofrece reintento', async () => {
    responder({ status: 404 }, { status: 404 });
    render(<LineaTiempoHistorial idSolicitud={999} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/No encontramos esa solicitud/);
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('usa el título recibido y el nivel de encabezado indicado', async () => {
    responder(HISTORIAL);
    render(<LineaTiempoHistorial idSolicitud={150} titulo="Seguimiento" nivelTitulo={3} />);
    expect(await screen.findByRole('heading', { level: 3, name: 'Seguimiento' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Seguimiento' })).toBeInTheDocument();
  });
});
