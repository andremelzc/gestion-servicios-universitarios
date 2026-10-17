import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { dashboardApi } from '../../../services/dashboard.api.js';
import { server } from '../../../test/server.js';
import EstadoBarChart from './EstadoBarChart.jsx';
import KpiResumen from './KpiResumen.jsx';
import WidgetDashboard from './WidgetDashboard.jsx';

const sinFiltros = { desde: '', hasta: '' };

function widgetEstado() {
  return (
    <WidgetDashboard
      titulo="Solicitudes por estado"
      cargar={dashboardApi.porEstado}
      filtros={sinFiltros}
    >
      {(datos) => <EstadoBarChart datos={datos} nivelTitulo={2} />}
    </WidgetDashboard>
  );
}

describe('WidgetDashboard', () => {
  it('[US-12 CA-11] pasa de cargando a los datos y solo invoca children con datos listos', async () => {
    const dibujar = vi.fn(() => <p>Listo</p>);
    render(
      <WidgetDashboard titulo="X" cargar={dashboardApi.kpis} filtros={sinFiltros}>
        {dibujar}
      </WidgetDashboard>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Cargando X…');
    expect(dibujar).not.toHaveBeenCalled();
    expect(await screen.findByText('Listo')).toBeInTheDocument();
    expect(dibujar).toHaveBeenCalledWith(expect.objectContaining({ registradas: 150 }));
  });

  it('[US-12 CA-10] el título del gráfico es un h2 en cargando, error y ok', async () => {
    let fallar = true;
    server.use(
      http.get('*/api/v1/dashboard/por-estado', () =>
        fallar
          ? HttpResponse.json({ status: 500 }, { status: 500 })
          : HttpResponse.json([{ nombre: 'REGISTRADA', valor: 4, colorHex: '#6B7280' }]),
      ),
    );
    render(widgetEstado());
    const titulo = () => screen.getByRole('heading', { level: 2, name: 'Solicitudes por estado' });

    expect(titulo()).toBeInTheDocument(); // cargando
    await screen.findByRole('alert');
    expect(titulo()).toBeInTheDocument(); // error

    fallar = false;
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await screen.findByRole('list', { name: 'Leyenda: Solicitudes por estado' });
    expect(titulo()).toBeInTheDocument(); // ok
  });

  it('[US-12 CA-13] los indicadores clave conservan su h2 en cargando, error y ok', async () => {
    let fallar = true;
    server.use(
      http.get('*/api/v1/dashboard/kpis', () =>
        fallar
          ? HttpResponse.json({ status: 500 }, { status: 500 })
          : HttpResponse.json({ registradas: 1, pendientes: 0, atendidas: 1, vencidas: 0 }),
      ),
    );
    render(
      <WidgetDashboard
        titulo="Indicadores clave"
        cargar={dashboardApi.kpis}
        filtros={sinFiltros}
        compacto
      >
        {(datos) => <KpiResumen datos={datos} />}
      </WidgetDashboard>,
    );
    const region = () => screen.getByRole('region', { name: 'Indicadores clave' });
    const h2 = () => screen.getByRole('heading', { level: 2, name: 'Indicadores clave' });

    expect(region()).toBeInTheDocument();
    expect(h2()).toBeInTheDocument();
    await screen.findByRole('alert');
    expect(region()).toBeInTheDocument();
    expect(h2()).toBeInTheDocument();

    fallar = false;
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await screen.findByRole('group', { name: 'Registradas' });
    expect(region()).toBeInTheDocument();
    expect(h2()).toBeInTheDocument();
  });

  it('[US-12 CA-10] un 403 no ofrece Reintentar', async () => {
    server.use(
      http.get('*/api/v1/dashboard/por-estado', () =>
        HttpResponse.json({ status: 403 }, { status: 403 }),
      ),
    );
    render(widgetEstado());

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
  });
});
