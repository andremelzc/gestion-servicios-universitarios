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
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('cambia de pestaña y consulta los estados de esa vista', async () => {
    const consultas = espiarBandeja();
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));
    await waitFor(() =>
      expect(ultima(consultas).getAll('estado')).toEqual(['ASIGNADA', 'EN_ATENCION']),
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Todas' }));
    await waitFor(() => expect(ultima(consultas).has('estado')).toBe(false));
    expect(screen.getByRole('tab', { name: 'Todas' })).toHaveAttribute('aria-selected', 'true');
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

  // Dos páginas con filas distintas: la lista debe cambiar de verdad al paginar.
  const filaPagina = (n) => ({ ...resumenEjemplo, id: 200 + n, codigo: `SOL-2026-02${n}0` });
  const porPagina = (params) => {
    const n = Number(params.get('page') ?? 0);
    return paginaDe([filaPagina(n)], { page: n, totalPages: 3, totalElements: 41 });
  };

  it('pagina mostrando las filas de cada página y vuelve a la primera al cambiar de pestaña', async () => {
    const consultas = espiarBandeja(porPagina);
    render(<BandejaSupervisorPage />);
    expect(await screen.findByText('SOL-2026-0200')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('SOL-2026-0210')).toBeInTheDocument();
    expect(screen.queryByText('SOL-2026-0200')).not.toBeInTheDocument();
    expect(ultima(consultas).get('page')).toBe('1');

    await userEvent.click(screen.getByRole('tab', { name: 'Todas' }));
    expect(await screen.findByText('SOL-2026-0200')).toBeInTheDocument();
    expect(ultima(consultas).has('page')).toBe(false);
  });

  it('si la página actual queda vacía (p. ej. tras asignar la última fila) retrocede a la anterior', async () => {
    const consultas = espiarBandeja((params) =>
      params.get('page') === '1'
        ? paginaDe([], { page: 1, totalPages: 1, totalElements: 20 })
        : paginaDe([filaPagina(0)], { page: 0, totalPages: 2, totalElements: 21 }),
    );
    render(<BandejaSupervisorPage />);
    await screen.findByText('SOL-2026-0200');

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('SOL-2026-0200')).toBeInTheDocument();
    expect(ultima(consultas).has('page')).toBe(false);
    expect(screen.queryByText('No hay solicitudes en esta vista.')).not.toBeInTheDocument();
  });

  it('el contenido va dentro de un landmark <main> con el título como encabezado', async () => {
    espiarBandeja();
    render(<BandejaSupervisorPage />);
    const principal = await screen.findByRole('main');
    expect(
      within(principal).getByRole('heading', { level: 1, name: 'Bandeja de solicitudes' }),
    ).toBeInTheDocument();
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
