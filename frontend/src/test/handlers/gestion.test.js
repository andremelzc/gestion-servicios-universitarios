import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// jsdom ↔ undici: en Node ≥ 22 el parser multipart de undici exige un File real y
// rechaza el de jsdom (`request.formData()` lanza y MSW responde 500). Se usan las
// clases de Node solo en este archivo: en `test/setup.js` chocarían con
// `URL.createObjectURL` de jsdom, que usan FileUploader y ModalResolucion.
beforeAll(async () => {
  const FormDataUndici = (
    await new Response('--b--\r\n', {
      headers: { 'Content-Type': 'multipart/form-data; boundary=b' },
    }).formData()
  ).constructor;
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  vi.stubGlobal('FormData', FormDataUndici);
});

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

  it('[US-10 CA-10] PUT resolver (multipart: datos + archivos) responde 200 RESUELTA con el informe', async () => {
    const cuerpo = new FormData();
    const datos = { informe: 'Se reemplazó el conector HDMI dañado.' };
    // jsdom: un Blob de jsdom no sobrevive a la serialización de undici (llega como "undefined"), por eso
    // la parte JSON se envía como texto; en el navegador real es un Blob `application/json`.
    cuerpo.append('datos', JSON.stringify(datos));
    cuerpo.append('archivos', new File(['x'], 'foto.png', { type: 'image/png' }));

    const respuesta = await fetch(`${API}/solicitudes/150/resolver`, {
      method: 'PUT',
      body: cuerpo,
    });
    const detalle = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(detalle.estado.codigo).toBe('RESUELTA');
    expect(detalle.informeResolucion).toBe(datos.informe);
  });

  // jsdom: un Blob de jsdom no sobrevive a la serialización de undici (llega como "undefined"), por eso
  // la parte JSON se envía como texto; en el navegador real es un Blob `application/json`.
  function resolver(id, informe, archivos = [], { extra = {} } = {}) {
    const cuerpo = new FormData();
    cuerpo.append('datos', JSON.stringify({ informe, ...extra }));
    archivos.forEach((archivo) => cuerpo.append('archivos', archivo));
    return fetch(`${API}/solicitudes/${id}/resolver`, { method: 'PUT', body: cuerpo });
  }
  const foto = (nombre = 'foto.png', contenido = 'x') =>
    new File([contenido], nombre, { type: 'image/png' });
  const INFORME_OK = 'Se reemplazó el conector HDMI dañado.';
  const TYPE_BACKEND = 'https://api.servicios.edu/errors/';

  it('[US-10 CA-11] informe de menos de 20 caracteres crudos: 400 de validación con errores.informe', async () => {
    const respuesta = await resolver(150, 'corto', [foto()]);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.type).toBe(`${TYPE_BACKEND}validation-error`);
    expect(problema.errores).toEqual({ informe: expect.any(String) });
  });

  it('[US-10 CA-11] informe vacío: 400 de validación con errores.informe', async () => {
    const respuesta = await resolver(150, '', [foto()]);

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).errores).toEqual({ informe: expect.any(String) });
  });

  it('[US-10 CA-11] informe de 20 espacios (válido crudo, corto al recortar): 400 plano sin errores', async () => {
    const respuesta = await resolver(150, `   ${'a'.repeat(5)}${' '.repeat(15)}`, [foto()]);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.type).toBe(`${TYPE_BACKEND}bad-request`);
    expect(problema.errores).toBeUndefined();
    expect(problema.detail).toBe('El informe de resolución debe contener al menos 20 caracteres.');
  });

  it('[US-10 CA-11] sin archivos: 400 plano con detail y sin mapa errores', async () => {
    const respuesta = await resolver(150, INFORME_OK);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.type).toBe(`${TYPE_BACKEND}bad-request`);
    expect(problema.errores).toBeUndefined();
    expect(problema.detail).toBe('Se requiere al menos 1 evidencia para resolver la solicitud.');
  });

  it('[US-10 CA-11] más de 3 archivos: 400 plano con detail', async () => {
    const cuatro = ['a', 'b', 'c', 'd'].map((n) => foto(`${n}.png`));
    const respuesta = await resolver(150, INFORME_OK, cuatro);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.errores).toBeUndefined();
    expect(problema.detail).toBe(
      'Se permiten como máximo 3 evidencias para resolver la solicitud.',
    );
  });

  it('[US-10 CA-11] archivo vacío: 400 plano "El archivo está vacío"', async () => {
    // jsdom reemplaza los File por 9 bytes basura; una parte de texto vacía es lo único que llega vacía.
    const respuesta = await resolver(150, INFORME_OK, ['']);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(problema.errores).toBeUndefined();
    expect(problema.detail).toBe('El archivo está vacío');
  });

  it('[US-10 CA-12] solicitud que no está EN_ATENCION: 409 con el detalle del backend', async () => {
    const respuesta = await resolver(151, INFORME_OK, [foto()]);
    const problema = await respuesta.json();

    expect(respuesta.status).toBe(409);
    expect(problema.type).toBe(`${TYPE_BACKEND}409`);
    expect(problema.detail).toBe('La solicitud debe estar EN_ATENCION para ser resuelta.');
  });
});
