import { describe, expect, it } from 'vitest';

const API = 'http://localhost/api/v1';

const enviar = (metodo, ruta, cuerpo) =>
  fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

const nueva = { nombre: 'Servicios Generales', correoContacto: 'generales@uni.edu' };

describe('MSW · handlers de administración, áreas (API §3.5)', () => {
  it('[US-16] GET /areas devuelve las activas con su correo de contacto', async () => {
    const lista = await (await enviar('GET', '/areas')).json();

    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({ id: 1, activo: true });
    expect(lista[0].correoContacto).toBeTruthy();
  });

  it('[US-16] POST crea (201), valida por campo (400) y rechaza nombre repetido (409)', async () => {
    const creada = await enviar('POST', '/areas', nueva);
    expect(creada.status).toBe(201);
    expect(await creada.json()).toMatchObject({ id: 3, ...nueva, activo: true });

    const invalida = await enviar('POST', '/areas', { nombre: '', correoContacto: 'x' });
    expect(invalida.status).toBe(400);
    expect(Object.keys((await invalida.json()).errores)).toEqual(['nombre', 'correoContacto']);

    expect((await enviar('POST', '/areas', nueva)).status).toBe(409);
  });

  it('[US-16] PUT actualiza y un id inexistente responde 404', async () => {
    const actualizada = await (await enviar('PUT', '/areas/2', nueva)).json();

    expect(actualizada).toMatchObject({ id: 2, ...nueva });
    expect((await enviar('PUT', '/areas/99', nueva)).status).toBe(404);
  });

  it('[US-16 / RN-14] DELETE da de baja (204); con usuarios activos responde 409', async () => {
    expect((await enviar('DELETE', '/areas/2')).status).toBe(204);
    const conUsuarios = await enviar('DELETE', '/areas/1');

    expect(conUsuarios.status).toBe(409);
    expect((await conUsuarios.json()).detail).toMatch(/usuarios activos/);
  });

  it('[US-16] PUT /reactivar restaura un área dada de baja', async () => {
    await enviar('DELETE', '/areas/2');

    expect((await (await enviar('PUT', '/areas/2/reactivar')).json()).activo).toBe(true);
    expect((await (await enviar('GET', '/areas')).json()).map((a) => a.id)).toEqual([1, 2]);
  });
});
