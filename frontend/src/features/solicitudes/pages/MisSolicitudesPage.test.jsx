import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { problema } from '../../../test/handlers/gestion.js';
import {
  misSolicitudesEjemplo,
  responderMisSolicitudes,
} from '../../../test/handlers/solicitudes.js';
import { restaurarAncho, simularAncho } from '../../../test/simularAncho.js';
import { server } from '../../../test/server.js';
import MisSolicitudesPage from './MisSolicitudesPage.jsx';

const RUTA_API = '*/api/v1/solicitudes/mis-solicitudes';

// Registra las consultas GET recibidas; la respuesta es la del handler compartido (filtros y
// sobre paginado de api-rest §2.3), para poder comprobar los parámetros que envía la pantalla.
function simularLista() {
  const consultas = [];
  server.use(
    http.get(RUTA_API, ({ request }) => {
      consultas.push(Object.fromEntries(new URL(request.url).searchParams));
      return responderMisSolicitudes(request);
    }),
  );
  return consultas;
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/mis-solicitudes']}>
      <Routes>
        <Route path="/mis-solicitudes" element={<MisSolicitudesPage />} />
        <Route path="/solicitudes/nueva" element={<p>Nueva solicitud</p>} />
        <Route path="/solicitudes/:id" element={<p>Detalle de la solicitud</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// La tabla se desmonta mientras carga (esqueleto) y vuelve a montarse: se consulta de nuevo.
const tablaActual = () => screen.getByRole('table', { name: 'Mis solicitudes' });
const filasActuales = () => within(tablaActual()).getAllByRole('row').slice(1);

afterEach(() => restaurarAncho());

describe('MisSolicitudesPage', () => {
  it('[CA-11] muestra la cabecera y la primera página de 20 (de 25) solicitudes propias', async () => {
    const consultas = simularLista();
    renderPagina();

    expect(screen.getByRole('heading', { level: 1, name: 'Mis solicitudes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva solicitud' })).toHaveAttribute(
      'href',
      '/solicitudes/nueva',
    );

    await screen.findByRole('table', { name: 'Mis solicitudes' });
    expect(consultas).toEqual([{ page: '0', size: '20' }]);
    expect(filasActuales()).toHaveLength(20);

    const primera = filasActuales()[0];
    expect(within(primera).getByText(misSolicitudesEjemplo[0].codigo)).toBeInTheDocument();
    expect(within(primera).getByText('Registrada')).toBeInTheDocument();
    expect(within(primera).getByText('Alta')).toBeInTheDocument();
    // 2026-10-17T15:00:00Z se muestra en America/Lima (api-rest §1).
    expect(within(primera).getByText('17/10/2026, 10:00')).toBeInTheDocument();
    // La fila 20 es la última de la página; la 21 pertenece a la siguiente.
    expect(within(tablaActual()).getByText(misSolicitudesEjemplo[19].codigo)).toBeInTheDocument();
    expect(
      within(tablaActual()).queryByText(misSolicitudesEjemplo[20].codigo),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('25 registros')).toBeInTheDocument();
  });

  it('[CA-11] "Siguiente" pide la página 1 y muestra las 5 restantes', async () => {
    const user = userEvent.setup();
    const consultas = simularLista();
    renderPagina();
    await screen.findByRole('table', { name: 'Mis solicitudes' });

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(consultas).toHaveLength(2));
    expect(consultas[1]).toEqual({ page: '1', size: '20' });

    await waitFor(() => expect(filasActuales()).toHaveLength(5));
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(within(tablaActual()).getByText(misSolicitudesEjemplo[24].codigo)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    await waitFor(() => expect(filasActuales()).toHaveLength(20));
    expect(consultas.at(-1)).toEqual({ page: '0', size: '20' });
  });

  it('[CA-11] el filtro por estado consulta estado=CERRADA y vuelve a la página 0', async () => {
    const user = userEvent.setup();
    const consultas = simularLista();
    renderPagina();
    await screen.findByRole('table', { name: 'Mis solicitudes' });

    // Ir a la página 2 para comprobar que el filtro regresa a la 0.
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ page: '1' }));

    await user.selectOptions(screen.getByLabelText('Estado'), 'CERRADA');
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ page: '0', estado: 'CERRADA' }));
    await waitFor(() => expect(filasActuales()).toHaveLength(4));
    expect(within(tablaActual()).getByText(misSolicitudesEjemplo[5].codigo)).toBeInTheDocument();
    expect(
      within(tablaActual()).queryByText(misSolicitudesEjemplo[0].codigo),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Estado'), '');
    await waitFor(() => expect(consultas.at(-1)).toEqual({ page: '0', size: '20' }));
    await waitFor(() => expect(filasActuales()).toHaveLength(20));
  });

  it('[CA-11] la búsqueda aplica tras el debounce y filtra por título o código', async () => {
    const user = userEvent.setup();
    const consultas = simularLista();
    renderPagina();
    await screen.findByRole('table', { name: 'Mis solicitudes' });
    expect(consultas).toHaveLength(1);

    await user.type(screen.getByRole('searchbox'), 'biblioteca');
    // Recién tecleado aún no se consulta: el debounce de `useCrud` es de 300 ms.
    expect(consultas).toHaveLength(1);
    await waitFor(() => expect(consultas).toHaveLength(2));
    expect(consultas[1]).toMatchObject({ q: 'biblioteca' });
    await waitFor(() => expect(filasActuales()).toHaveLength(1));
    expect(within(tablaActual()).getByText('Wi-Fi caído en la biblioteca')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), '0130');
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ q: '0130' }));
    await waitFor(() => expect(filasActuales()).toHaveLength(1));
    expect(within(tablaActual()).getByText(misSolicitudesEjemplo[20].codigo)).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    await waitFor(() => expect(consultas.at(-1)).toMatchObject({ q: 'zzz' }));
    await screen.findByText('Sin resultados para «zzz». Prueba con otra búsqueda.');
  });

  it('muestra el estado vacío de UX §9 con acceso a crear la primera solicitud', async () => {
    server.use(
      http.get(RUTA_API, () =>
        HttpResponse.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      ),
    );
    renderPagina();

    await screen.findByText('Aún no tienes solicitudes. Crea la primera para empezar.');
    expect(screen.getByRole('link', { name: 'Crear una' })).toHaveAttribute(
      'href',
      '/solicitudes/nueva',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('muestra el aviso de error con el código de soporte y reintenta', async () => {
    const user = userEvent.setup();
    let fallar = true;
    server.use(
      http.get(RUTA_API, ({ request }) => {
        if (fallar) {
          return problema(
            500,
            'interno',
            'Error interno',
            'Fallo controlado de la prueba.',
            '/api/v1/solicitudes/mis-solicitudes',
          );
        }
        return responderMisSolicitudes(request);
      }),
    );
    renderPagina();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Ocurrió un error inesperado.');
    expect(alerta).toHaveTextContent('4bf92f3577b34da6a3ce929d0e0e4736');

    fallar = false;
    await user.click(within(alerta).getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(filasActuales()).toHaveLength(20));
  });

  it('muestra el esqueleto mientras responde la consulta', async () => {
    let liberar;
    const puerta = new Promise((resolver) => {
      liberar = resolver;
    });
    server.use(
      http.get(RUTA_API, async ({ request }) => {
        await puerta;
        return responderMisSolicitudes(request);
      }),
    );
    renderPagina();

    expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    liberar();
    await screen.findByRole('table', { name: 'Mis solicitudes' });
  });

  it('en móvil pinta tarjetas (lista) con los datos de cada solicitud', async () => {
    simularAncho(false);
    renderPagina();

    const lista = await screen.findByRole('list', { name: 'Mis solicitudes' });
    const tarjetas = within(lista).getAllByRole('listitem');
    expect(tarjetas).toHaveLength(20);

    const primera = tarjetas[0];
    expect(within(primera).getByText('Código')).toBeInTheDocument();
    expect(within(primera).getByText(misSolicitudesEjemplo[0].codigo)).toBeInTheDocument();
    expect(within(primera).getByText('Registrada')).toBeInTheDocument();
    expect(within(primera).getByRole('link')).toHaveAttribute('href', '/solicitudes/150');
  });
});
