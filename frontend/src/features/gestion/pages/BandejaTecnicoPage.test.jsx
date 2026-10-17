import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { paginaDe, problema, resumenEjemplo } from '../../../test/handlers/gestion.js';
import { server } from '../../../test/server.js';
import { restaurarAncho, simularAncho } from '../../../test/simularAncho.js';
import BandejaTecnicoPage from './BandejaTecnicoPage.jsx';

const asignada = { ...resumenEjemplo, estadoCodigo: 'ASIGNADA', estadoNombre: 'Asignada' };
const enAtencion = {
  ...resumenEjemplo,
  id: 151,
  codigo: 'SOL-2026-0151',
  titulo: 'Wi-Fi del laboratorio',
  estadoCodigo: 'EN_ATENCION',
  estadoNombre: 'En atención',
};

// Estado por prueba, como el API real: iniciar una solicitud la pasa de ASIGNADA a EN_ATENCION.
function bandejaConEstado(filas = [asignada, enAtencion]) {
  const estado = new Map(filas.map((f) => [f.id, f.estadoCodigo]));
  const consultas = [];
  server.use(
    http.get('*/api/v1/solicitudes', ({ request }) => {
      const params = new URL(request.url).searchParams;
      consultas.push(params);
      const estados = params.getAll('estado');
      const visibles = filas
        .map((f) => ({ ...f, estadoCodigo: estado.get(f.id) }))
        .filter((f) => estados.includes(f.estadoCodigo));
      return HttpResponse.json(paginaDe(visibles));
    }),
  );
  return { estado, consultas };
}

const regionAviso = () => document.querySelector('.region-aviso');

// Móvil por defecto (mobile-first): la bandeja se dibuja como tarjetas.
beforeEach(() => simularAncho(false));
afterEach(restaurarAncho);

describe('BandejaTecnicoPage', () => {
  it('muestra "Por iniciar" como tarjetas con prioridad, SLA y la acción de iniciar', async () => {
    const { consultas } = bandejaConEstado();
    render(<BandejaTecnicoPage />);

    const lista = await screen.findByRole('list', { name: 'Solicitudes asignadas' });
    const tarjeta = within(lista).getByText('SOL-2026-0150').closest('li');
    expect(within(tarjeta).getByText('Proyector sin imagen')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Alta')).toBeInTheDocument();
    expect(within(tarjeta).getByText('Vencida')).toBeInTheDocument();
    expect(
      within(tarjeta).getByRole('button', { name: 'Iniciar atención SOL-2026-0150' }),
    ).toBeInTheDocument();
    expect(consultas[0].getAll('estado')).toEqual(['ASIGNADA']);
    expect(screen.getByRole('tab', { name: 'Por iniciar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('el contenido va en un landmark <main> con el título como encabezado', async () => {
    bandejaConEstado();
    render(<BandejaTecnicoPage />);
    const principal = await screen.findByRole('main');
    expect(
      within(principal).getByRole('heading', { level: 1, name: 'Mis asignadas' }),
    ).toBeVisible();
  });

  it('en "En curso" no ofrece iniciar la atención', async () => {
    const { consultas } = bandejaConEstado();
    render(<BandejaTecnicoPage />);
    await screen.findByText('SOL-2026-0150');

    await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));

    expect(await screen.findByText('SOL-2026-0151')).toBeInTheDocument();
    expect(consultas[consultas.length - 1].getAll('estado')).toEqual(['EN_ATENCION']);
    expect(screen.queryByRole('button', { name: /Iniciar atención/ })).not.toBeInTheDocument();
  });

  describe('iniciar la atención', () => {
    function iniciarEn(estado, { respuesta } = {}) {
      const llamadas = [];
      server.use(
        http.put('*/api/v1/solicitudes/:id/iniciar-atencion', async ({ params }) => {
          llamadas.push(Number(params.id));
          if (respuesta) return respuesta(params);
          estado.set(Number(params.id), 'EN_ATENCION');
          return HttpResponse.json({ id: Number(params.id) });
        }),
      );
      return llamadas;
    }
    const botonIniciar = () =>
      screen.findByRole('button', { name: 'Iniciar atención SOL-2026-0150' });

    it('inicia, quita la fila de "Por iniciar", anuncia y mueve el foco al título', async () => {
      const { estado, consultas } = bandejaConEstado();
      const llamadas = iniciarEn(estado);
      render(<BandejaTecnicoPage />);
      await userEvent.click(await botonIniciar());

      expect(await screen.findByText('No tienes solicitudes por iniciar.')).toBeInTheDocument();
      expect(screen.queryByText('SOL-2026-0150')).not.toBeInTheDocument();
      expect(llamadas).toEqual([150]);
      expect(consultas.length).toBeGreaterThan(1);
      expect(regionAviso()).toHaveTextContent(
        'SOL-2026-0150 está en atención. La encuentras en "En curso".',
      );
      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1, name: 'Mis asignadas' })).toHaveFocus(),
      );

      await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));
      expect(await screen.findByText('SOL-2026-0150')).toBeInTheDocument();
    });

    it('la región de avisos existe desde el inicio, vacía y sin aria-label', async () => {
      bandejaConEstado();
      render(<BandejaTecnicoPage />);
      expect(regionAviso()).toBeEmptyDOMElement();
      expect(regionAviso()).not.toHaveAttribute('aria-label');
      await screen.findByText('SOL-2026-0150');
    });

    it('ignora un segundo clic mientras la petición está en vuelo y deshabilita el botón', async () => {
      const { estado } = bandejaConEstado();
      const llamadas = iniciarEn(estado, {
        respuesta: async (params) => {
          await new Promise((r) => setTimeout(r, 60));
          estado.set(Number(params.id), 'EN_ATENCION');
          return HttpResponse.json({ id: Number(params.id) });
        },
      });
      render(<BandejaTecnicoPage />);
      const boton = await botonIniciar();

      await userEvent.dblClick(boton);

      expect(boton).toBeDisabled();
      await screen.findByText('No tienes solicitudes por iniciar.');
      expect(llamadas).toEqual([150]);
    });

    it('con un 409 muestra la alerta y refresca la lista para reflejar el estado real', async () => {
      const { estado, consultas } = bandejaConEstado();
      iniciarEn(estado, {
        respuesta: (params) => {
          // Otro usuario ya la inició.
          estado.set(Number(params.id), 'EN_ATENCION');
          return problema(409, 'transicion-invalida', 'Conflicto', 'Ya cambió.', '/x');
        },
      });
      render(<BandejaTecnicoPage />);
      await userEvent.click(await botonIniciar());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Esta solicitud ya cambió de estado',
      );
      await waitFor(() => expect(consultas.length).toBeGreaterThan(1));
      expect(await screen.findByText('No tienes solicitudes por iniciar.')).toBeInTheDocument();
    });
  });

  it('muestra el vacío y el error de la consulta', async () => {
    server.use(http.get('*/api/v1/solicitudes', () => HttpResponse.json(paginaDe([]))));
    render(<BandejaTecnicoPage />);
    expect(await screen.findByText('No tienes solicitudes por iniciar.')).toBeInTheDocument();

    server.use(http.get('*/api/v1/solicitudes', () => problema(403, 'prohibido', 'No', 'x', '/x')));
    await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
  });
});
