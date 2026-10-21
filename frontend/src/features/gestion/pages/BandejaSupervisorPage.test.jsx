import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { paginaDe, problema, resumenEjemplo } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import { restaurarAncho, simularAncho } from '../../../test/simularAncho.js';
import BandejaSupervisorPage from './BandejaSupervisorPage.jsx';

// Registra cada consulta que llega a `GET /solicitudes` y responde con la lista indicada.
function espiarBandeja(respuesta = () => paginaDe([resumenEjemplo])) {
  const consultas = [];
  server.use(
    http.get('*/api/v1/solicitudes', ({ request }) => {
      const url = new URL(request.url);
      consultas.push(url.searchParams);
      return HttpResponse.json(respuesta(url.searchParams));
    }),
  );
  return consultas;
}

const ultima = (consultas) => consultas[consultas.length - 1];

beforeEach(() => simularAncho(true));
afterEach(restaurarAncho);

describe('BandejaSupervisorPage', () => {
  it('lista la bandeja con prioridad, estado y SLA, y consulta primero "Por asignar"', async () => {
    const consultas = espiarBandeja();
    render(<BandejaSupervisorPage />);

    const fila = (await screen.findByText('SOL-2026-0150')).closest('tr');
    expect(within(fila).getByText('Proyector sin imagen')).toBeInTheDocument();
    expect(within(fila).getByText('Alta')).toBeInTheDocument();
    expect(within(fila).getByText('En evaluación')).toBeInTheDocument();
    expect(within(fila).getByText('Vencida')).toBeInTheDocument();
    expect(consultas[0].getAll('estado')).toEqual(['REGISTRADA', 'EN_EVALUACION']);
    expect(screen.getByRole('button', { name: 'Por asignar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('cambia de pestaña y consulta los estados de esa vista', async () => {
    const consultas = espiarBandeja();
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.click(screen.getByRole('button', { name: 'En curso' }));
    await waitFor(() =>
      expect(ultima(consultas).getAll('estado')).toEqual(['ASIGNADA', 'EN_ATENCION']),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));
    await waitFor(() => expect(ultima(consultas).has('estado')).toBe(false));
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('aplica los filtros de prioridad, categoría, técnico y vencidas', async () => {
    const consultas = espiarBandeja();
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.selectOptions(await screen.findByLabelText('Prioridad'), 'Alta');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Equipos de Cómputo');
    await userEvent.selectOptions(screen.getByLabelText('Técnico'), 'Carlos Ruiz');
    await userEvent.click(screen.getByLabelText('Solo vencidas'));

    await waitFor(() => expect(ultima(consultas).get('vencidas')).toBe('true'));
    expect(ultima(consultas).get('idPrioridad')).toBe('3');
    expect(ultima(consultas).get('idCategoria')).toBe('2');
    expect(ultima(consultas).get('idTecnico')).toBe('14');
  });

  it('busca por código o título esperando a que se deje de escribir', async () => {
    const consultas = espiarBandeja();
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'wifi');
    await waitFor(() => expect(ultima(consultas).get('q')).toBe('wifi'));
    expect(consultas.filter((c) => c.has('q'))).toHaveLength(1);
  });

  it('pagina y vuelve a la primera página al cambiar de pestaña', async () => {
    const consultas = espiarBandeja(() =>
      paginaDe([resumenEjemplo], { totalPages: 3, totalElements: 41 }),
    );
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(ultima(consultas).get('page')).toBe('1'));

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));
    await waitFor(() => expect(ultima(consultas).has('page')).toBe(false));
  });

  it('muestra el error de la consulta y permite reintentar', async () => {
    server.use(
      http.get('*/api/v1/solicitudes', () =>
        problema(500, 'interno', 'Error', 'fallo', '/api/v1/solicitudes'),
      ),
    );
    render(<BandejaSupervisorPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');

    server.use(
      http.get('*/api/v1/solicitudes', () => HttpResponse.json(paginaDe([resumenEjemplo]))),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('SOL-2026-0150')).toBeInTheDocument();
  });

  it('muestra un vacío con texto cuando la vista no tiene solicitudes', async () => {
    espiarBandeja(() => paginaDe([]));
    render(<BandejaSupervisorPage />);
    expect(await screen.findByText('No hay solicitudes en esta vista.')).toBeInTheDocument();
  });
});
