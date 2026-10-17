import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  problema,
  login,
  registro,
  usuarioDeAutorizacion,
  parseMultipart,
  crearSolicitud,
  esMultipart,
} from '../mock/handlers.js';

const usuarios = [
  { id: 7, nombre: 'Juan', apellido: 'Pérez', correo: 'juan@universidad.edu', rol: 'ESTUDIANTE', idArea: null, password: 'Demo1234' },
];

test('problema sigue RFC 7807 con traceId y timestamp', () => {
  const p = problema(409, 'duplicado', 'Conflicto', 'detalle', '/api/v1/x');
  assert.equal(p.status, 409);
  assert.match(p.type, /problemas\/duplicado$/);
  assert.equal(p.instance, '/api/v1/x');
  assert.match(p.traceId, /^[0-9a-f]{32}$/);
  assert.ok(p.timestamp);
});

test('login 200 devuelve token y usuario sin password', () => {
  const r = login(usuarios, { correo: 'JUAN@universidad.edu', password: 'Demo1234' });
  assert.equal(r.status, 200);
  assert.equal(r.body.tipo, 'Bearer');
  assert.equal(r.body.expiraEn, 28800);
  assert.equal(r.body.usuario.password, undefined);
  assert.equal(r.body.usuario.rol, 'ESTUDIANTE');
});

test('login 401 con el mismo mensaje para correo inexistente o clave erronea', () => {
  const a = login(usuarios, { correo: 'juan@universidad.edu', password: 'mala' });
  const b = login(usuarios, { correo: 'nadie@universidad.edu', password: 'Demo1234' });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal(a.body.detail, 'Credenciales inválidas');
  assert.equal(b.body.detail, 'Credenciales inválidas');
});

test('login 400 con errores por campo', () => {
  const r = login(usuarios, { correo: 'no-es-correo', password: '' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errores.correo);
  assert.ok(r.body.errores.password);
});

test('registro 201, 400 y 409', () => {
  const ok = { codigoInstitucional: 'U20261099', nombre: 'Lucia', apellido: 'Mendoza', correo: 'lucia@universidad.edu', password: 'Password123' };
  const creado = registro(usuarios, ok);
  assert.equal(creado.status, 201);
  assert.equal(creado.body.usuario.rol, 'ESTUDIANTE');
  assert.equal(registro(usuarios, { ...ok, correo: 'juan@universidad.edu' }).status, 409);
  assert.equal(registro(usuarios, { ...ok, password: 'x' }).status, 400);
  assert.equal(registro(usuarios, { ...ok, rol: 'ADMIN' }).status, 400);
});

test('usuarioDeAutorizacion resuelve el token mock', () => {
  assert.equal(usuarioDeAutorizacion(usuarios, 'Bearer mock.7').id, 7);
  assert.equal(usuarioDeAutorizacion(usuarios, 'Bearer mock.99'), null);
  assert.equal(usuarioDeAutorizacion(usuarios, undefined), null);
});

test('parseMultipart extrae partes JSON y archivos', () => {
  const b = 'XBOUNDARYX';
  const cuerpo = Buffer.from(
    `--${b}\r\nContent-Disposition: form-data; name="solicitud"; filename="blob"\r\nContent-Type: application/json\r\n\r\n{"titulo":"Hola mundo"}\r\n` +
      `--${b}\r\nContent-Disposition: form-data; name="archivos"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\nBINARIO\r\n--${b}--\r\n`,
  );
  const partes = parseMultipart(cuerpo, `multipart/form-data; boundary=${b}`);
  assert.equal(partes.length, 2);
  assert.deepEqual(JSON.parse(partes[0].data.toString()), { titulo: 'Hola mundo' });
  assert.equal(partes[1].filename, 'a.jpg');
  assert.deepEqual(parseMultipart(Buffer.from('x'), 'application/json'), []);
});

const valida = {
  idCategoria: 2, idPrioridad: 3, titulo: 'Proyector sin imagen nuevo',
  descripcion: 'El proyector enciende pero no muestra imagen.',
  ubicacionCampus: 'Campus Central', ubicacionAmbiente: 'Pabellón B - Aula 402',
};
const ctx = () => ({
  solicitudes: [],
  siguienteNumero: 151,
  ahora: new Date('2026-10-03T15:04:05Z'),
  categorias: [{ id: 2, nombre: 'Redes', activo: true }, { id: 9, nombre: 'Vieja', activo: false }],
  prioridades: [{ id: 3, nombre: 'ALTA', slaMaxHoras: 24, activo: true }, { id: 4, nombre: 'CRITICA', slaMaxHoras: 4, activo: true }],
  campus: [{ id: 1, nombre: 'Campus Central', activo: true }],
});

test('crearSolicitud 201 con codigo SOL-AAAA-NNNN', () => {
  const r = crearSolicitud(ctx(), usuarios[0], valida, 0);
  assert.equal(r.status, 201);
  assert.equal(r.body.codigo, 'SOL-2026-0151');
  assert.equal(r.body.estado, 'REGISTRADA');
  assert.equal(r.body.mensaje, 'Solicitud registrada con éxito');
  assert.equal(r.location, '/api/v1/solicitudes/151');
});

test('el SLA sale de las horas de la prioridad, no de un valor fijo', () => {
  const alta = crearSolicitud(ctx(), usuarios[0], valida, 0).body;
  assert.equal(alta.fechaLimiteSla, '2026-10-04T15:04:05.000Z');
  const critica = crearSolicitud(ctx(), usuarios[0], { ...valida, idPrioridad: 4 }, 0).body;
  assert.equal(critica.fechaLimiteSla, '2026-10-03T19:04:05.000Z');
});

test('crearSolicitud 400 con HTML y descripcion corta', () => {
  const r = crearSolicitud(ctx(), usuarios[0], { ...valida, titulo: '<b>x</b>hola', descripcion: 'corta' }, 0);
  assert.equal(r.status, 400);
  assert.ok(r.body.errores.titulo);
  assert.ok(r.body.errores.descripcion);
});

test('crearSolicitud 400 con mas de 3 archivos', () => {
  assert.equal(crearSolicitud(ctx(), usuarios[0], valida, 4).status, 400);
});

test('crearSolicitud 400 si categoria, prioridad o campus no existen o estan inactivos', () => {
  const casos = [
    [{ idCategoria: 99 }, 'idCategoria'],
    [{ idCategoria: 9 }, 'idCategoria'],
    [{ idPrioridad: 99 }, 'idPrioridad'],
    [{ ubicacionCampus: 'Campus Fantasma' }, 'ubicacionCampus'],
  ];
  for (const [cambio, campo] of casos) {
    const r = crearSolicitud(ctx(), usuarios[0], { ...valida, ...cambio }, 0);
    assert.equal(r.status, 400, campo);
    assert.ok(r.body.errores[campo], campo);
  }
});

test('un titulo repetido ya no es 409: esa regla no esta en la documentacion', () => {
  const c = ctx();
  c.solicitudes.push({ solicitanteId: 7, titulo: valida.titulo, estado: 'REGISTRADA' });
  assert.equal(crearSolicitud(c, usuarios[0], valida, 0).status, 201);
});

test('esMultipart exige multipart/form-data', () => {
  assert.equal(esMultipart('multipart/form-data; boundary=abc'), true);
  assert.equal(esMultipart('application/json'), false);
  assert.equal(esMultipart(undefined), false);
});
