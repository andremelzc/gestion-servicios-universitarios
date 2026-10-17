import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import { AuthProvider, STORAGE_KEY } from '../../auth/AuthContext.jsx';
import DashboardPage from './DashboardPage.jsx';

afterEach(() => {
  server.events.removeAllListeners();
  localStorage.clear();
});

// Monta la página con una sesión del rol indicado (el guardia de rol lee `useAuth`).
function renderizar(rol = 'TECNICO') {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token: 'token-de-prueba', usuario: { id: 1, nombre: 'Ana', rol } }),
  );
  return render(
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>,
  );
}

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
    renderizar();
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
    renderizar();

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
    renderizar();
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
    renderizar();
    await esperarCarga();

    expect(within(screen.getByRole('group', { name: 'MTTR' })).getByText('—')).toBeInTheDocument();
  });

  it('[US-12 CA-10] si un widget falla, solo ese muestra el error y los demás siguen', async () => {
    fallar('por-estado');
    renderizar();
    await esperarCarga();

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('trace-1');
    expect(screen.getByRole('region', { name: 'Solicitudes por estado' })).toContainElement(alerta);
    expect(screen.getByRole('heading', { name: 'Solicitudes por categoría' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Registradas' })).toHaveTextContent('150');
  });

  it('[US-12 CA-10] si fallan los KPIs con 403, los gráficos siguen y no hay Reintentar', async () => {
    fallar('kpis', 403);
    renderizar();
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
    renderizar();
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
    renderizar();
    await esperarCarga();

    const tarjeta = screen.getByRole('region', { name: 'Solicitudes por responsable' });
    expect(within(tarjeta).getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos para mostrar.')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('[US-12 CA-10] sin conexión muestra el microcopy de UX §9', async () => {
    server.use(http.get('*/api/v1/dashboard/por-categoria', () => HttpResponse.error()));
    renderizar();
    await esperarCarga();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
    );
  });

  it('[US-12 UAT-10] sin filtros pide los cinco endpoints sin parámetros', async () => {
    const urls = registrarPeticiones();
    renderizar();
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
    renderizar();
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
    renderizar();
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
      renderizar();
      await esperarCarga();

      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();
    });

    it('[US-12 UAT-10] refleja el rango aplicado, no el escrito sin aplicar', async () => {
      renderizar();
      await esperarCarga();

      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();

      await rango('2026-10-01', '2026-10-03');
      expect(screen.getByText('Mostrando: del 01/10/2026 al 03/10/2026')).toBeInTheDocument();
      await esperarCarga();
    });

    it('[US-12 UAT-10] con un rango inválido conserva el rango anterior', async () => {
      renderizar();
      await esperarCarga();

      await rango('2026-10-05', '2026-10-01');

      expect(screen.getByText('Mostrando: últimos 30 días')).toBeInTheDocument();
    });
  });

  describe('visibilidad por rol (RN-16, DASH-15)', () => {
    // Todas las peticiones a dashboard y áreas (pathname + query).
    function registrarTodas() {
      const rutas = [];
      server.events.on('request:start', ({ request }) => {
        const url = new URL(request.url);
        if (/\/(dashboard|areas)/.test(url.pathname)) rutas.push(url.pathname + url.search);
      });
      return rutas;
    }

    it('[DASH-15 CA-4] ADMIN ve el filtro Área con las áreas de GET /areas', async () => {
      renderizar('ADMIN');

      expect(await screen.findByRole('option', { name: 'Infraestructura' })).toBeInTheDocument();
      expect(screen.getByLabelText('Área')).toHaveValue('');
      await esperarCarga();
    });

    it.each(['TECNICO', 'SUPERVISOR'])(
      '[DASH-15 CA-4] %s no ve el filtro Área, no pide /areas y nunca envía idArea',
      async (rol) => {
        const rutas = registrarTodas();
        renderizar(rol);
        await esperarCarga();

        expect(screen.queryByLabelText('Área')).not.toBeInTheDocument();
        expect(rutas.some((r) => r.includes('/areas'))).toBe(false);
        expect(rutas).toHaveLength(5);
        expect(rutas.some((r) => r.includes('idArea'))).toBe(false);
      },
    );

    it('[DASH-15 CA-4] ADMIN con un área elegida la envía en los cinco widgets', async () => {
      const urls = registrarPeticiones();
      renderizar('ADMIN');
      await esperarCarga();
      await userEvent.selectOptions(await screen.findByLabelText('Área'), 'Infraestructura');
      urls.length = 0;

      await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
      await esperarCarga();

      expect(urls).toHaveLength(5);
      expect(urls.every((u) => u.searchParams.get('idArea') === '2')).toBe(true);
    });

    it('[DASH-15 CA-4] ADMIN con "Todas las áreas" no envía idArea', async () => {
      const urls = registrarPeticiones();
      renderizar('ADMIN');
      await esperarCarga();
      expect(await screen.findByRole('option', { name: 'Infraestructura' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
      await esperarCarga();

      expect(urls.some((u) => u.searchParams.has('idArea'))).toBe(false);
    });

    it('[DASH-15 CA-4] si GET /areas falla, ADMIN ve el aviso y el dashboard sigue funcionando', async () => {
      server.use(
        http.get('*/api/v1/areas', () => HttpResponse.json({ status: 500 }, { status: 500 })),
      );
      renderizar('ADMIN');
      await esperarCarga();

      expect(await screen.findByText('No se pudieron cargar las áreas.')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Indicadores clave' })).toBeInTheDocument();
    });

    it.each(['ESTUDIANTE', 'DOCENTE'])(
      '[DASH-15 CA-4] %s recibe un mensaje de acceso no permitido sin ninguna petición',
      async (rol) => {
        const rutas = registrarTodas();
        renderizar(rol);

        const titulo = await screen.findByRole('heading', {
          level: 1,
          name: 'Acceso no permitido',
        });
        expect(titulo).toHaveFocus();
        expect(
          screen.getByText('Tu rol no tiene acceso al dashboard.', { exact: false }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();
        await new Promise((r) => setTimeout(r, 50));
        expect(rutas).toEqual([]);
      },
    );
  });
});
