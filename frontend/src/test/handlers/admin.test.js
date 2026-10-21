import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarAdmin } from './admin.js';

const API = 'http://localhost/api/v1';

const enviar = (metodo, ruta, cuerpo) =>
  fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

beforeEach(() => reiniciarAdmin());

describe('MSW · handlers de administración, prioridades (API §3.5)', () => {
  it('[US-31] GET /prioridades devuelve solo las activas por defecto', async () => {
    await enviar('DELETE', '/prioridades/1');
    const lista = await (await enviar('GET', '/prioridades')).json();

    expect(lista.map((p) => p.nivel)).toEqual(['MEDIA', 'ALTA', 'CRITICA']);
    expect(lista[0]).toEqual({
      id: 2,
      nivel: 'MEDIA',
      ponderador: 2,
      slaMaxHoras: 48,
      activo: true,
    });
  });

  it('[US-31] GET con ?incluirInactivos=true incluye las dadas de baja', async () => {
    await enviar('DELETE', '/prioridades/1');
    const lista = await (await enviar('GET', '/prioridades?incluirInactivos=true')).json();

    expect(lista).toHaveLength(4);
    expect(lista.find((p) => p.id === 1).activo).toBe(false);
  });

  it('[US-31] POST crea la prioridad y responde 201', async () => {
    const respuesta = await enviar('POST', '/prioridades', {
      nivel: 'URGENTE',
      ponderador: 5,
      slaMaxHoras: 2,
    });

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject({ id: 5, nivel: 'URGENTE', activo: true });
  });

  it('[US-31] POST con slaMaxHoras <= 0 responde 400 con errores por campo', async () => {
    const respuesta = await enviar('POST', '/prioridades', {
      nivel: 'URGENTE',
      ponderador: 5,
      slaMaxHoras: 0,
    });
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.errores.slaMaxHoras).toBeTruthy();
  });

  it('[US-31] POST con un nivel repetido responde 409 (conflicto de unicidad)', async () => {
    const respuesta = await enviar('POST', '/prioridades', {
      nivel: 'ALTA',
      ponderador: 5,
      slaMaxHoras: 2,
    });

    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).type).toMatch(/\/conflicto$/);
  });

  it('[US-31] el nivel repetido se detecta sin distinguir mayúsculas', async () => {
    const respuesta = await enviar('POST', '/prioridades', {
      nivel: 'alta',
      ponderador: 5,
      slaMaxHoras: 2,
    });

    expect(respuesta.status).toBe(409);
  });

  it('[US-31 CA-6] PUT cambia el SLA; DELETE da 204 y reactivar vuelve a activar', async () => {
    const cambio = await enviar('PUT', '/prioridades/3', {
      nivel: 'ALTA',
      ponderador: 3,
      slaMaxHoras: 12,
    });
    expect((await cambio.json()).slaMaxHoras).toBe(12);

    expect((await enviar('DELETE', '/prioridades/3')).status).toBe(204);
    const reactivada = await enviar('PUT', '/prioridades/3/reactivar');
    expect((await reactivada.json()).activo).toBe(true);
  });

  it('[US-31] PUT sobre una prioridad inexistente responde 404', async () => {
    const respuesta = await enviar('PUT', '/prioridades/99', {
      nivel: 'X',
      ponderador: 1,
      slaMaxHoras: 1,
    });

    expect(respuesta.status).toBe(404);
  });
});
