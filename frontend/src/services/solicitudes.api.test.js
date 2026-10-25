import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../test/server.js';
import { apiClient } from './apiClient.js';
import {
  asignar,
  construirConsulta,
  evaluar,
  iniciarAtencion,
  listarBandeja,
  listarPrioridades,
  resolver,
} from './solicitudes.api.js';

describe('construirConsulta', () => {
  it('omite los filtros vacíos y repite `estado` por cada código', () => {
    const consulta = construirConsulta({
      estados: ['ASIGNADA', 'EN_ATENCION'],
      idPrioridad: '',
      q: '  proyector  ',
      vencidas: true,
      page: 2,
      size: 10,
    });
    const params = new URLSearchParams(consulta);
    expect(params.getAll('estado')).toEqual(['ASIGNADA', 'EN_ATENCION']);
    expect(params.get('q')).toBe('proyector');
    expect(params.get('vencidas')).toBe('true');
    expect(params.get('page')).toBe('2');
    expect(params.has('idPrioridad')).toBe(false);
  });

  it('no envía `vencidas` cuando es falso', () => {
    expect(construirConsulta({ vencidas: false })).toBe('');
  });
});

describe('listarBandeja', () => {
  it('normaliza el sobre de Spring (`number`) y el de api-rest (`page`)', async () => {
    server.use(
      http.get('*/api/v1/solicitudes', () =>
        HttpResponse.json({
          content: [{ id: 1 }],
          number: 3,
          size: 20,
          totalElements: 61,
          totalPages: 4,
        }),
      ),
    );
    const { data, page } = await listarBandeja('page=3');
    expect(data).toEqual([{ id: 1 }]);
    expect(page).toEqual({ page: 3, size: 20, totalElements: 61, totalPages: 4 });
  });

  it('envía la consulta tal cual al API', async () => {
    let url;
    server.use(
      http.get('*/api/v1/solicitudes', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );
    await listarBandeja('estado=ASIGNADA&q=wifi');
    expect(url.searchParams.get('estado')).toBe('ASIGNADA');
    expect(url.searchParams.get('q')).toBe('wifi');
  });
});

describe('catálogos y acciones', () => {
  it('adapta las prioridades (`nivel`) al formato {id, nombre} del modal', async () => {
    expect(await listarPrioridades()).toEqual([
      { id: 1, nombre: 'Baja' },
      { id: 2, nombre: 'Media' },
      { id: 3, nombre: 'Alta' },
      { id: 4, nombre: 'Crítica' },
    ]);
  });

  it('evalúa y asigna con PUT y cuerpo JSON', async () => {
    const llamadas = [];
    server.use(
      http.put('*/api/v1/solicitudes/:id/:accion', async ({ params, request }) => {
        llamadas.push([params.accion, await request.json()]);
        return HttpResponse.json({ id: Number(params.id) });
      }),
    );
    await evaluar(150, { idPrioridad: 3 });
    await asignar(150, { idTecnico: 14, nota: 'Urgente' });
    expect(llamadas).toEqual([
      ['evaluar', { idPrioridad: 3 }],
      ['asignar', { idTecnico: 14, nota: 'Urgente' }],
    ]);
  });
});

describe('acciones del técnico', () => {
  it('inicia la atención con PUT sin cuerpo', async () => {
    let metodo;
    server.use(
      http.put('*/api/v1/solicitudes/:id/iniciar-atencion', ({ request }) => {
        metodo = request.method;
        return HttpResponse.json({ id: 150 });
      }),
    );
    await iniciarAtencion(150);
    expect(metodo).toBe('PUT');
  });

  it('resuelve en multipart: parte `datos` (Blob JSON) y una parte `archivos` por archivo', async () => {
    // Un Blob de jsdom llega a MSW como "undefined" (límite de la serialización de undici), así
    // que el cuerpo se inspecciona antes de salir, en el `FormData` que recibe `apiClient`.
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 150 });
    const archivos = [
      new File(['a'], 'uno.png', { type: 'image/png' }),
      new File(['b'], 'dos.png', { type: 'image/png' }),
    ];
    await resolver(150, { informe: 'Se reemplazó el cable de video.', archivos });

    const [ruta, cuerpo] = put.mock.calls[0];
    expect(ruta).toBe('/solicitudes/150/resolver');
    const datos = cuerpo.get('datos');
    expect(datos.type).toBe('application/json');
    const texto = await new Promise((resolve) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.readAsText(datos);
    });
    expect(JSON.parse(texto)).toEqual({ informe: 'Se reemplazó el cable de video.' });
    expect(cuerpo.getAll('archivos')).toEqual(archivos);
    put.mockRestore();
  });
});
