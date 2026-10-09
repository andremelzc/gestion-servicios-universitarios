import { describe, expect, it } from 'vitest';

const API = 'http://localhost/api/v1';
const BASE_TYPE = 'https://servicios.universidad.edu/problemas/';

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

  it('[US-08 CA-1] PUT asignar responde 200 con el SolicitudDetalle completo (API §3.2)', async () => {
    const respuesta = await asignar(150, { idTecnico: 14, nota: 'Urgente' });
    const detalle = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(Object.keys(detalle)).toEqual([
      'id',
      'codigo',
      'titulo',
      'descripcion',
      'ubicacionCampus',
      'ubicacionAmbiente',
      'categoria',
      'area',
      'prioridad',
      'estado',
      'solicitante',
      'tecnico',
      'informeResolucion',
      'fechaRegistro',
      'fechaLimiteSla',
      'fechaResolucion',
      'fechaCierre',
      'vencida',
      'evidencias',
      'accionesPermitidas',
    ]);
    expect(detalle.id).toBe(150);
    expect(detalle.area).toEqual({ id: 1, nombre: 'Tecnologías de la Información' });
    expect(detalle.estado.codigo).toBe('ASIGNADA');
    expect(detalle.tecnico).toEqual({ id: 14, nombre: 'Carlos', apellido: 'Ruiz' });
  });

  it('[US-08 CA-1] acepta idTecnico como número o como cadena numérica', async () => {
    const respuesta = await asignar(150, { idTecnico: '15' });
    const detalle = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(detalle.tecnico.id).toBe(15);
  });

  it('[US-08 CA-4] falta idTecnico: 400 RFC 7807 de tipo validacion con errores por campo', async () => {
    const respuesta = await asignar(150, { nota: 'sin técnico' });
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(respuesta.headers.get('Content-Type')).toContain('application/problem+json');
    expect(problema.type).toBe(`${BASE_TYPE}validacion`);
    expect(problema.instance).toBe('/api/v1/solicitudes/150/asignar');
    expect(problema.errores).toEqual({ idTecnico: expect.any(String) });
    expect(problema.traceId).toEqual(expect.any(String));
  });

  it('[US-08 CA-4] técnico inexistente o de otra área: 400 "Técnico no válido" sin errores por campo', async () => {
    const respuesta = await asignar(150, { idTecnico: 999 });
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.title).toBe('Técnico no válido');
    expect(problema.type).toBe(`${BASE_TYPE}validacion`);
    expect(problema.errores).toBeUndefined();
    expect(problema.detail).toContain('técnico');
  });
});
