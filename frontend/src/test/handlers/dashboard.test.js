import { describe, expect, it } from 'vitest';
import { kpisEjemplo } from './dashboard.js';

const API = 'http://localhost/api/v1/dashboard';

async function pedir(ruta) {
  const respuesta = await fetch(`${API}/${ruta}`);
  return { status: respuesta.status, cuerpo: await respuesta.json() };
}

describe('MSW · handlers del dashboard (API §3.4)', () => {
  it('[US-12 CA-1] kpis devuelve el objeto con la forma de KpisResponse', async () => {
    const { status, cuerpo } = await pedir('kpis');

    expect(status).toBe(200);
    expect(cuerpo).toEqual(kpisEjemplo);
    expect(Object.keys(cuerpo).sort()).toEqual(
      [
        'atendidas',
        'desde',
        'hasta',
        'mttrHoras',
        'pendientes',
        'porcentajeResueltas',
        'registradas',
        'vencidas',
      ].sort(),
    );
  });

  it.each(['por-categoria', 'por-prioridad', 'por-responsable'])(
    '[US-12 CA-5] %s devuelve [{nombre, valor}]',
    async (ruta) => {
      const { cuerpo } = await pedir(ruta);

      expect(cuerpo.length).toBeGreaterThan(0);
      for (const item of cuerpo) {
        expect(typeof item.nombre).toBe('string');
        expect(typeof item.valor).toBe('number');
      }
    },
  );

  it('[US-12 CA-6] por-estado incluye colorHex en cada ítem', async () => {
    const { cuerpo } = await pedir('por-estado');

    expect(cuerpo.every((item) => /^#[0-9A-F]{6}$/i.test(item.colorHex))).toBe(true);
  });
});
