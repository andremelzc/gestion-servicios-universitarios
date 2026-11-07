import { beforeEach, describe, expect, it } from 'vitest';
import { reiniciarAreas } from './admin.areas.js';
import { reiniciarCategorias } from './admin.categorias.js';

const API = 'http://localhost/api/v1';

const enviar = (metodo, ruta, cuerpo) =>
  fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

const nueva = { nombre: 'Conectividad Wi-Fi', descripcion: null, idArea: 1, tiempoSlaHoras: 24 };

beforeEach(() => {
  reiniciarAreas();
  reiniciarCategorias();
});

describe('MSW · handlers de administración, categorías (API §3.5)', () => {
  it('[US-15] GET /categorias devuelve solo las activas; con ?incluirInactivos=true, todas', async () => {
    await enviar('DELETE', '/categorias/3');

    const activas = await (await enviar('GET', '/categorias')).json();
    const todas = await (await enviar('GET', '/categorias?incluirInactivos=true')).json();

    expect(activas.map((c) => c.id)).toEqual([2]);
    expect(todas.map((c) => c.activo)).toEqual([true, false]);
  });

  it('[US-15] GET /categorias?idArea= filtra por área', async () => {
    const lista = await (await enviar('GET', '/categorias?idArea=2')).json();

    expect(lista.map((c) => c.nombre)).toEqual(['Mobiliario']);
  });

  it('[US-15] POST crea con id, nombre del área y activo (201)', async () => {
    const respuesta = await enviar('POST', '/categorias', nueva);

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject({
      id: 4,
      nombre: 'Conectividad Wi-Fi',
      idArea: 1,
      area: 'Tecnología de la Información',
      tiempoSlaHoras: 24,
      activo: true,
    });
  });

  it('[US-15] POST valida por campo (400) y rechaza nombre repetido (409)', async () => {
    const invalida = await enviar('POST', '/categorias', {
      ...nueva,
      nombre: '',
      tiempoSlaHoras: 0,
    });
    const repetida = await enviar('POST', '/categorias', { ...nueva, nombre: 'mobiliario' });

    expect(invalida.status).toBe(400);
    expect(Object.keys((await invalida.json()).errores)).toEqual(['nombre', 'tiempoSlaHoras']);
    expect(repetida.status).toBe(409);
  });

  it('[US-15] PUT actualiza; un id inexistente responde 404', async () => {
    const respuesta = await enviar('PUT', '/categorias/2', { ...nueva, nombre: 'Equipos' });

    expect(await respuesta.json()).toMatchObject({ id: 2, nombre: 'Equipos', idArea: 1 });
    expect((await enviar('PUT', '/categorias/99', nueva)).status).toBe(404);
  });

  it('[US-15 / RN-14] DELETE da de baja lógica (204) y PUT /reactivar la restaura', async () => {
    expect((await enviar('DELETE', '/categorias/2')).status).toBe(204);
    const baja = await (await enviar('GET', '/categorias?incluirInactivos=true')).json();
    expect(baja.find((c) => c.id === 2).activo).toBe(false);

    const reactivada = await (await enviar('PUT', '/categorias/2/reactivar')).json();
    expect(reactivada.activo).toBe(true);
  });
});
