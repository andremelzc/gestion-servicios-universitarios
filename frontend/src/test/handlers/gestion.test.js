import { describe, expect, it } from 'vitest';

const API = 'http://localhost/api/v1';

function asignar(id, cuerpo) {
  return fetch(`${API}/solicitudes/${id}/asignar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

describe('MSW · handlers de gestión (API §3.2 y §3.6)', () => {
  it('[US-08 CA-17] GET /usuarios/tecnicos devuelve técnicos activos con su carga actual', async () => {
    const respuesta = await fetch(`${API}/usuarios/tecnicos`);
    const tecnicos = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(tecnicos[0]).toEqual({
      id: 14,
      nombre: 'Carlos',
      apellido: 'Ruiz',
      idArea: 1,
      activo: true,
      cargaActual: 3,
    });
  });

  it('[US-08 CA-1] PUT /solicitudes/:id/asignar responde 200 con la solicitud ASIGNADA', async () => {
    const respuesta = await asignar(150, { idTecnico: 14, nota: 'Urgente' });
    const detalle = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(detalle.estado.codigo).toBe('ASIGNADA');
    expect(detalle.tecnico).toEqual({ id: 14, nombre: 'Carlos', apellido: 'Ruiz' });
  });

  it('[US-08 CA-4] responde 400 RFC 7807 con errores por campo si falta idTecnico', async () => {
    const respuesta = await asignar(150, { nota: 'sin técnico' });
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(respuesta.headers.get('Content-Type')).toContain('application/problem+json');
    expect(problema.errores).toEqual({ idTecnico: expect.any(String) });
    expect(problema.traceId).toEqual(expect.any(String));
  });
});
