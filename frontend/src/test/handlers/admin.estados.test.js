import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarAdmin } from './admin.js';

const API = 'http://localhost/api/v1';

const enviar = (metodo, ruta, cuerpo) =>
  fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

const presentacion = { nombreVisible: 'En revisión', descripcion: null, colorHex: '#D97706' };

beforeEach(() => reiniciarAdmin());

describe('MSW · handlers de administración, estados (API §3.5, ADR-009)', () => {
  it('[US-32] GET /estados devuelve los 6 estados fijos en su orden', async () => {
    const estados = await (await enviar('GET', '/estados')).json();

    expect(estados.map((e) => e.codigo)).toEqual([
      'REGISTRADA',
      'EN_EVALUACION',
      'ASIGNADA',
      'EN_ATENCION',
      'RESUELTA',
      'CERRADA',
    ]);
    expect(estados[1]).toEqual({
      codigo: 'EN_EVALUACION',
      nombreVisible: 'En evaluación',
      descripcion: 'Un supervisor revisa la solicitud.',
      colorHex: '#D97706',
      orden: 2,
      esFinal: false,
    });
  });

  it('[US-32 CA-7] PUT /estados/{codigo} cambia solo la presentación y no el código', async () => {
    const respuesta = await enviar('PUT', '/estados/EN_EVALUACION', presentacion);
    const estado = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(estado).toMatchObject({ codigo: 'EN_EVALUACION', ...presentacion, orden: 2 });
  });

  it('[US-32 CA-7] un colorHex inválido ("rojo") responde 400 con el error por campo', async () => {
    const respuesta = await enviar('PUT', '/estados/EN_EVALUACION', {
      ...presentacion,
      colorHex: 'rojo',
    });

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).errores.colorHex).toBeTruthy();
  });

  it('[US-32 CA-7] POST y DELETE sobre /estados no existen (405) y un código ajeno da 404', async () => {
    expect((await enviar('POST', '/estados', presentacion)).status).toBe(405);
    expect((await enviar('DELETE', '/estados/CERRADA')).status).toBe(405);
    expect((await enviar('PUT', '/estados/NO_EXISTE', presentacion)).status).toBe(404);
  });
});
