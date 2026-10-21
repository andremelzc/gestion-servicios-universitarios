import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import DashboardPage from './DashboardPage.jsx';

afterEach(() => server.events.removeAllListeners());

const TITULOS_GRAFICOS = [
  'Solicitudes por categoría',
  'Solicitudes por prioridad',
  'Solicitudes por responsable',
  'Solicitudes por estado',
];

// Espera a que todos los widgets terminen de cargar.
async function esperarCarga() {
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
}

function fallar(ruta, status = 500) {
  server.use(
    http.get(`*/api/v1/dashboard/${ruta}`, () =>
      HttpResponse.json({ status, traceId: 'trace-1' }, { status }),
    ),
  );
}

// Registra las peticiones al dashboard (el listener se limpia al terminar cada prueba).
function registrarPeticiones() {
  const urls = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.includes('/dashboard/')) urls.push(url);
  });
  return urls;
}

describe('DashboardPage', () => {
  it('[US-12 UAT-10] muestra el h1, los filtros de fecha y los cinco widgets', async () => {
    render(<DashboardPage />);
    await esperarCarga();

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Indicadores clave' })).toBeInTheDocument();
    for (const titulo of TITULOS_GRAFICOS) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
    }
  });

  it('[US-12 CA-11] mientras carga, cada widget muestra su propio aviso de carga', async () => {
    render(<DashboardPage />);

    expect(screen.getAllByRole('status').map((a) => a.textContent)).toEqual([
      'Cargando Indicadores clave…',
      'Cargando Solicitudes por categoría…',
      'Cargando Solicitudes por prioridad…',
      'Cargando Solicitudes por responsable…',
      'Cargando Solicitudes por estado…',
    ]);
    await esperarCarga();
  });

  it('[US-12 CA-1] los KPIs y los gráficos muestran las cifras del backend', async () => {
    render(<DashboardPage />);
    await esperarCarga();

    expect(screen.getByRole('group', { name: 'Registradas' })).toHaveTextContent('150');
    expect(screen.getByRole('list', { name: 'Leyenda: Solicitudes por estado' })).toHaveTextContent(
      'En atención',
    );
    expect(
      screen.getByRole('list', { name: 'Leyenda: Solicitudes por responsable' }),
    ).toHaveTextContent('Carlos Ruiz');
  });

  it('[US-12 CA-11] con MTTR null la página muestra "—" en ese KPI', async () => {
    server.use(
      http.get('*/api/v1/dashboard/kpis', () =>
        HttpResponse.json({
          registradas: 0,
          pendientes: 0,
          atendidas: 0,
          vencidas: 0,
          mttrHoras: null,
        }),
      ),
    );
    render(<DashboardPage />);
    await esperarCarga();

    expect(within(screen.getByRole('group', { name: 'MTTR' })).getByText('—')).toBeInTheDocument();
  });

  it('[US-12 CA-10] si un widget falla, solo ese muestra el error y los demás siguen', async () => {
    fallar('por-estado');
    render(<DashboardPage />);
    await esperarCarga();

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('trace-1');
    expect(screen.getByRole('region', { name: 'Solicitudes por estado' })).toContainElement(alerta);
    expect(screen.getByRole('heading', { name: 'Solicitudes por categoría' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Registradas' })).toHaveTextContent('150');
  });

  it('[US-12 CA-10] si fallan los KPIs con 403, los gráficos siguen y no hay Reintentar', async () => {
    fallar('kpis', 403);
    render(<DashboardPage />);
    await esperarCarga();

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
    for (const titulo of TITULOS_GRAFICOS) {
      expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument();
    }
  });

  it('[US-12 CA-10] Reintentar vuelve a pedir solo ese widget y lo recupera', async () => {
    let llamadasEstado = 0;
    let llamadasKpis = 0;
    server.use(
      http.get('*/api/v1/dashboard/kpis', () => {
        llamadasKpis += 1;
        return HttpResponse.json({ registradas: 1 });
      }),
      http.get('*/api/v1/dashboard/por-estado', () => {
        llamadasEstado += 1;
        return llamadasEstado === 1
          ? HttpResponse.json({ status: 500 }, { status: 500 })
          : HttpResponse.json([{ nombre: 'REGISTRADA', valor: 4, colorHex: '#6B7280' }]);
      }),
    );
    render(<DashboardPage />);
    await esperarCarga();

    await userEvent.click(
      screen.getByRole('button', { name: 'Reintentar: Solicitudes por estado' }),
    );

    expect(
      await screen.findByRole('list', { name: 'Leyenda: Solicitudes por estado' }),
    ).toHaveTextContent('Registrada');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(llamadasEstado).toBe(2);
    expect(llamadasKpis).toBe(1);
  });

  it('[US-12 CA-11] un gráfico sin datos muestra su estado vacío sin romper los demás', async () => {
    server.use(http.get('*/api/v1/dashboard/por-responsable', () => HttpResponse.json([])));
    render(<DashboardPage />);
    await esperarCarga();

    const tarjeta = screen.getByRole('region', { name: 'Solicitudes por responsable' });
    expect(within(tarjeta).getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos para mostrar.')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('[US-12 CA-10] sin conexión muestra el microcopy de UX §9', async () => {
    server.use(http.get('*/api/v1/dashboard/por-categoria', () => HttpResponse.error()));
    render(<DashboardPage />);
    await esperarCarga();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
    );
  });

  it('[US-12 UAT-10] sin filtros pide los cinco endpoints sin parámetros', async () => {
    const urls = registrarPeticiones();
    render(<DashboardPage />);
    await esperarCarga();

    expect(urls.map((u) => u.pathname.split('/').pop()).sort()).toEqual([
      'kpis',
      'por-categoria',
      'por-estado',
      'por-prioridad',
      'por-responsable',
    ]);
    expect(urls.every((u) => u.search === '')).toBe(true);
  });

  it('[US-12 UAT-10] al aplicar un rango, los cinco widgets se recargan con desde y hasta', async () => {
    render(<DashboardPage />);
    await esperarCarga();
    const urls = registrarPeticiones();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-03' } });
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    await esperarCarga();

    expect(urls).toHaveLength(5);
    for (const url of urls) {
      expect(url.searchParams.get('desde')).toBe('2026-10-01');
      expect(url.searchParams.get('hasta')).toBe('2026-10-03');
    }
  });

  it('[US-12 UAT-10] con un rango inválido no se vuelve a pedir nada', async () => {
    render(<DashboardPage />);
    await esperarCarga();
    const urls = registrarPeticiones();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-05' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(urls).toEqual([]);
  });

  describe('línea "Mostrando"', () => {
    const rango = (desde, hasta) => {
      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: desde } });
      fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: hasta } });
      return userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    };

    it('[US-12 UAT-10] al inicio indica los últimos 30 días', async () => {
      render(<DashboardPage />);
      await esperarCarga();

      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();
    });

    it('[US-12 UAT-10] refleja el rango aplicado, no el escrito sin aplicar', async () => {
      render(<DashboardPage />);
      await esperarCarga();

      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();

      await rango('2026-10-01', '2026-10-03');
      expect(screen.getByText('Mostrando: del 01/10/2026 al 03/10/2026')).toBeInTheDocument();
      await esperarCarga();
    });

    it('[US-12 UAT-10] con un rango inválido conserva el rango anterior', async () => {
      render(<DashboardPage />);
      await esperarCarga();

      await rango('2026-10-05', '2026-10-01');

      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();
    });
  });
});
