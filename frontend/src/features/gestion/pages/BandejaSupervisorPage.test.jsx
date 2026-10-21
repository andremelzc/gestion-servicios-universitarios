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

  describe('asignación', () => {
    const registrada = {
      ...resumenEjemplo,
      estadoCodigo: 'REGISTRADA',
      estadoNombre: 'Registrada',
    };
    const regionAviso = () => document.querySelector('.region-aviso');

    // Estado por prueba: las filas asignadas dejan de aparecer en la lista, como en el API real.
    function bandejaConEstado(filas) {
      const asignadas = new Set();
      const consultas = [];
      server.use(
        http.get('*/api/v1/solicitudes', ({ request }) => {
          consultas.push(new URL(request.url).searchParams);
          return HttpResponse.json(paginaDe(filas.filter((f) => !asignadas.has(f.id))));
        }),
      );
      return { asignadas, consultas };
    }

    function espiarAcciones({ asignar } = {}) {
      const llamadas = [];
      server.use(
        http.put('*/api/v1/solicitudes/:id/:accion', async ({ params, request }) => {
          llamadas.push([params.accion, await request.json()]);
          if (params.accion === 'asignar' && asignar) return asignar(params);
          return HttpResponse.json({ id: Number(params.id) });
        }),
      );
      return llamadas;
    }

    async function abrir(codigo = 'SOL-2026-0150', verbo = 'Asignar') {
      await userEvent.click(await screen.findByRole('button', { name: `${verbo} ${codigo}` }));
      const dialogo = await screen.findByRole('dialog');
      await userEvent.selectOptions(await within(dialogo).findByLabelText('Técnico'), '14');
      return dialogo;
    }
    const enviar = (dialogo) =>
      userEvent.click(within(dialogo).getByRole('button', { name: 'Asignar' }));

    it('asigna, cierra el modal, quita la fila, anuncia y mueve el foco al título', async () => {
      const { asignadas } = bandejaConEstado([resumenEjemplo]);
      const llamadas = espiarAcciones({
        asignar: (params) => {
          asignadas.add(Number(params.id));
          return HttpResponse.json({ id: Number(params.id) });
        },
      });
      render(<BandejaSupervisorPage />);
      const dialogo = await abrir();

      await enviar(dialogo);

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(llamadas).toEqual([['asignar', { idTecnico: 14 }]]);
      expect(await screen.findByText('No hay solicitudes en esta vista.')).toBeInTheDocument();
      expect(screen.queryByText('SOL-2026-0150')).not.toBeInTheDocument();
      expect(regionAviso()).toHaveTextContent('SOL-2026-0150 asignada a Carlos Ruiz.');
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { level: 1, name: 'Bandeja de solicitudes' }),
        ).toHaveFocus(),
      );
    });

    it('la región de avisos existe desde el inicio y se vacía al empezar otra acción', async () => {
      bandejaConEstado([resumenEjemplo, { ...resumenEjemplo, id: 151, codigo: 'SOL-2026-0151' }]);
      espiarAcciones();
      render(<BandejaSupervisorPage />);
      expect(regionAviso()).toBeInTheDocument();
      expect(regionAviso()).toBeEmptyDOMElement();
      expect(regionAviso()).not.toHaveAttribute('aria-label');

      await enviar(await abrir());
      await waitFor(() => expect(regionAviso()).toHaveTextContent('SOL-2026-0150 asignada'));

      await userEvent.click(await screen.findByRole('button', { name: 'Asignar SOL-2026-0151' }));
      expect(regionAviso()).toBeEmptyDOMElement();
    });

    it('en REGISTRADA permite cambiar la prioridad: evalúa antes de asignar', async () => {
      bandejaConEstado([registrada]);
      const llamadas = espiarAcciones();
      render(<BandejaSupervisorPage />);
      const dialogo = await abrir();
      await userEvent.selectOptions(
        within(dialogo).getByLabelText('Prioridad definitiva'),
        'Media',
      );

      await enviar(dialogo);

      await waitFor(() => expect(llamadas).toHaveLength(2));
      expect(llamadas).toEqual([
        ['evaluar', { idPrioridad: 2 }],
        ['asignar', { idTecnico: 14 }],
      ]);
    });

    it('fuera de REGISTRADA no ofrece prioridad ni llama a evaluar (el API solo la admite ahí)', async () => {
      bandejaConEstado([resumenEjemplo]);
      const llamadas = espiarAcciones();
      render(<BandejaSupervisorPage />);
      const dialogo = await abrir();
      expect(within(dialogo).queryByLabelText('Prioridad definitiva')).not.toBeInTheDocument();

      await enviar(dialogo);

      await waitFor(() => expect(llamadas).toHaveLength(1));
      expect(llamadas[0]).toEqual(['asignar', { idTecnico: 14 }]);
    });

    it('permite reasignar una solicitud en atención', async () => {
      bandejaConEstado([{ ...resumenEjemplo, estadoCodigo: 'EN_ATENCION' }]);
      const llamadas = espiarAcciones();
      render(<BandejaSupervisorPage />);

      await enviar(await abrir('SOL-2026-0150', 'Reasignar'));

      await waitFor(() => expect(llamadas).toEqual([['asignar', { idTecnico: 14 }]]));
    });

    describe('fallo parcial (evaluar bien, asignar falla)', () => {
      const falla = () => problema(409, 'transicion-invalida', 'Conflicto', 'Ya cambió.', '/x');

      async function fallarAsignando() {
        const { consultas } = bandejaConEstado([registrada]);
        const llamadas = espiarAcciones({ asignar: falla });
        render(<BandejaSupervisorPage />);
        const dialogo = await abrir();
        await userEvent.selectOptions(
          within(dialogo).getByLabelText('Prioridad definitiva'),
          'Media',
        );
        await enviar(dialogo);
        await within(dialogo).findByRole('alert');
        return { consultas, llamadas, dialogo };
      }

      it('refresca la lista, mantiene el modal con el error y al reintentar no repite evaluar', async () => {
        const { consultas, llamadas, dialogo } = await fallarAsignando();
        await waitFor(() => expect(consultas.length).toBeGreaterThan(1));
        expect(within(dialogo).getByRole('alert')).toHaveTextContent('ya cambió de estado');

        await enviar(dialogo);
        await waitFor(() => expect(llamadas.filter(([a]) => a === 'asignar')).toHaveLength(2));
        expect(llamadas.filter(([a]) => a === 'evaluar')).toHaveLength(1);
      });

      it('al cerrar el modal se olvida lo evaluado: reabrir vuelve a evaluar', async () => {
        const { llamadas, dialogo } = await fallarAsignando();
        await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        const otro = await abrir();
        await userEvent.selectOptions(within(otro).getByLabelText('Prioridad definitiva'), 'Media');
        await enviar(otro);

        await waitFor(() => expect(llamadas.filter(([a]) => a === 'evaluar')).toHaveLength(2));
      });
    });

    it('mantiene el modal abierto y muestra el error si el servidor rechaza', async () => {
      bandejaConEstado([resumenEjemplo]);
      espiarAcciones({
        asignar: () => problema(409, 'transicion-invalida', 'Conflicto', 'Ya fue asignada.', '/x'),
      });
      render(<BandejaSupervisorPage />);
      const dialogo = await abrir();

      await enviar(dialogo);

      expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
        'Esta solicitud ya cambió de estado',
      );
    });
  });
});
