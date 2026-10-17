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

    it('limpia el aviso y la alerta anteriores al empezar otra acción', async () => {
      const filas = [asignada, { ...asignada, id: 152, codigo: 'SOL-2026-0152' }];
      const { estado } = bandejaConEstado(filas);
      iniciarEn(estado);
      render(<BandejaTecnicoPage />);
      await userEvent.click(await botonIniciar());
      await waitFor(() =>
        expect(regionAviso()).toHaveTextContent('SOL-2026-0150 está en atención'),
      );

      await userEvent.click(
        await screen.findByRole('button', { name: 'Iniciar atención SOL-2026-0152' }),
      );

      await waitFor(() =>
        expect(regionAviso()).toHaveTextContent('SOL-2026-0152 está en atención'),
      );
      expect(regionAviso()).not.toHaveTextContent('SOL-2026-0150');
    });
  });

  describe('resolución', () => {
    async function abrirResolver(estado) {
      render(<BandejaTecnicoPage />);
      await screen.findByText('SOL-2026-0150');
      await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Resolver SOL-2026-0151' }));
      expect(estado.get(151)).toBe('EN_ATENCION');
      return screen.findByRole('dialog');
    }

    async function completar(dialogo) {
      await userEvent.type(
        within(dialogo).getByLabelText('Informe técnico *'),
        'Se reemplazó el cable de video y se probó.',
      );
      await userEvent.upload(
        within(dialogo).getByLabelText(/Evidencia de la solución/),
        new File(['x'], 'foto.png', { type: 'image/png' }),
      );
    }

    it('envía el informe y las evidencias, cierra el modal, quita la fila y anuncia', async () => {
      const { estado } = bandejaConEstado();
      let formulario;
      server.use(
        http.put('*/api/v1/solicitudes/151/resolver', async ({ request }) => {
          formulario = await request.formData();
          estado.set(151, 'RESUELTA');
          return HttpResponse.json({ id: 151 });
        }),
      );
      const dialogo = await abrirResolver(estado);
      await completar(dialogo);

      await userEvent.click(within(dialogo).getByRole('button', { name: 'Marcar resuelta' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      // jsdom entrega los Blob y File a MSW sin contenido ni nombre: solo se verifican las partes.
      expect(formulario.has('datos')).toBe(true);
      expect(formulario.getAll('archivos')).toHaveLength(1);
      expect(await screen.findByText('No tienes solicitudes en curso.')).toBeInTheDocument();
      expect(screen.queryByText('SOL-2026-0151')).not.toBeInTheDocument();
      expect(regionAviso()).toHaveTextContent('SOL-2026-0151 marcada como resuelta.');
      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1, name: 'Mis asignadas' })).toHaveFocus(),
      );
    });

    it('mantiene el modal abierto con el error del servidor y no toca la lista', async () => {
      const { estado } = bandejaConEstado();
      server.use(
        http.put('*/api/v1/solicitudes/151/resolver', () =>
          problema(409, 'transicion-invalida', 'Conflicto', 'Ya fue resuelta.', '/x'),
        ),
      );
      const dialogo = await abrirResolver(estado);
      await completar(dialogo);

      await userEvent.click(within(dialogo).getByRole('button', { name: 'Marcar resuelta' }));

      expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
        'Esta solicitud ya cambió de estado',
      );
      expect(regionAviso()).toBeEmptyDOMElement();
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

  it('pagina mostrando las filas de cada página y retrocede si la actual queda vacía', async () => {
    const fila = (n) => ({ ...asignada, id: 300 + n, codigo: `SOL-2026-03${n}0` });
    const consultas = [];
    server.use(
      http.get('*/api/v1/solicitudes', ({ request }) => {
        const params = new URL(request.url).searchParams;
        consultas.push(params);
        return params.get('page') === '1'
          ? HttpResponse.json(paginaDe([], { page: 1, totalPages: 1, totalElements: 20 }))
          : HttpResponse.json(paginaDe([fila(0)], { page: 0, totalPages: 2, totalElements: 21 }));
      }),
    );
    render(<BandejaTecnicoPage />);
    await screen.findByText('SOL-2026-0300');

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(consultas.some((c) => c.get('page') === '1')).toBe(true));
    expect(await screen.findByText('SOL-2026-0300')).toBeInTheDocument();
    expect(consultas[consultas.length - 1].has('page')).toBe(false);
  });
});
