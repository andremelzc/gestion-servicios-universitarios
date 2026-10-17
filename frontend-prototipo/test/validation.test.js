import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MENSAJES,
  contieneHtml,
  validarCorreo,
  evaluarPassword,
  validarPassword,
  validarTitulo,
  validarDescripcion,
  validarTextoCorto,
  validarArchivo,
  validarArchivos,
  validarRegistro,
  formatearContador,
  contarCaracteres,
} from '../js/lib/validation.js';

const MB = 1024 * 1024;

test('contieneHtml detecta etiquetas pero no texto normal', () => {
  assert.equal(contieneHtml('<script>alert(1)</script>'), true);
  assert.equal(contieneHtml('hola <b>mundo</b>'), true);
  assert.equal(contieneHtml('El proyector enciende pero 3 < 5 no se ve'), false);
  assert.equal(contieneHtml('Aula B-402'), false);
});

test('validarCorreo: obligatorio y con formato', () => {
  assert.equal(validarCorreo(''), MENSAJES.correoRequerido);
  assert.equal(validarCorreo('juan'), MENSAJES.correoInvalido);
  assert.equal(validarCorreo('juan@gmail.com'), null);
});

test('validarCorreo institucional usa el microcopy del documento', () => {
  assert.equal(
    validarCorreo('juan@gmail.com', { institucional: true }),
    'Debe usar correo institucional (@universidad.edu).',
  );
  assert.equal(validarCorreo('JUAN@Universidad.EDU', { institucional: true }), null);
});

test('evaluarPassword evalua las 3 reglas RN-03 y que no sea el correo', () => {
  const r = evaluarPassword('abcdefgh');
  assert.deepEqual(r.reglas, { longitud: true, mayuscula: false, numero: false });
  assert.equal(r.ok, false);
  assert.equal(evaluarPassword('Abcdefg1').ok, true);
  assert.equal(evaluarPassword('Abc1').reglas.longitud, false);
  assert.equal(evaluarPassword('Juan@universidad.edu1', 'juan@universidad.edu1').ok, false);
});

test('validarPassword devuelve el microcopy de contraseña débil', () => {
  assert.equal(validarPassword('abc'), 'Mínimo 8 caracteres, una mayúscula y un número.');
  assert.equal(validarPassword('Password123'), null);
  assert.equal(validarPassword(''), MENSAJES.passwordRequerida);
});

test('validarTitulo: 5 a 150 caracteres y sin HTML', () => {
  assert.ok(validarTitulo('abc'));
  assert.equal(validarTitulo('Proyector sin imagen'), null);
  assert.equal(validarTitulo('<b>Proyector</b>'), MENSAJES.sinHtml);
  assert.ok(validarTitulo('x'.repeat(151)));
});

test('validarDescripcion: mensaje con contador, maximo 500 y sin HTML', () => {
  assert.equal(
    validarDescripcion('corta'),
    'Describe el problema con al menos 15 caracteres (5/15).',
  );
  assert.equal(validarDescripcion('El proyector no muestra imagen'), null);
  assert.ok(validarDescripcion('x'.repeat(501)));
  assert.equal(validarDescripcion('<img src=x onerror=alert(1)> suficientes'), MENSAJES.sinHtml);
});

test('validarTextoCorto: obligatorio, <=100 y sin HTML', () => {
  assert.ok(validarTextoCorto('', 'Ubicación'));
  assert.equal(validarTextoCorto('Pabellón B - Aula 402', 'Ubicación'), null);
  assert.ok(validarTextoCorto('x'.repeat(101), 'Ubicación'));
  assert.equal(validarTextoCorto('<i>x</i>', 'Ubicación'), MENSAJES.sinHtml);
});

test('validarArchivo aplica RN-15 (tipo y 5 MB)', () => {
  assert.equal(validarArchivo({ name: 'a.jpg', size: 1 * MB, type: 'image/jpeg' }), null);
  assert.equal(validarArchivo({ name: 'a.png', size: 5 * MB, type: 'image/png' }), null);
  assert.equal(validarArchivo({ name: 'a.pdf', size: 2 * MB, type: 'application/pdf' }), null);
  assert.equal(
    validarArchivo({ name: 'a.jpg', size: 5 * MB + 1, type: 'image/jpeg' }),
    'El archivo excede los 5 MB permitidos. Reduce su tamaño e inténtalo de nuevo.',
  );
  assert.equal(
    validarArchivo({ name: 'a.gif', size: 10, type: 'image/gif' }),
    'Solo se permiten imágenes JPG, PNG o archivos PDF.',
  );
});

test('validarArchivos separa validos y errores y limita a 3', () => {
  const ok = (n) => ({ name: `${n}.jpg`, size: MB, type: 'image/jpeg' });
  const r = validarArchivos([ok(1), { name: 'x.gif', size: 1, type: 'image/gif' }, ok(2)]);
  assert.equal(r.validos.length, 2);
  assert.equal(r.errores.length, 1);
  assert.equal(r.errores[0].nombre, 'x.gif');

  const muchos = validarArchivos([ok(1), ok(2), ok(3), ok(4)]);
  assert.equal(muchos.validos.length, 3);
  assert.equal(muchos.errores[0].mensaje, MENSAJES.maxArchivos);
});

test('validarRegistro devuelve un mapa campo -> mensaje', () => {
  const errores = validarRegistro({
    codigoInstitucional: 'U1',
    nombre: 'J',
    apellido: 'Pérez',
    correo: 'juan@gmail.com',
    password: 'abc',
  });
  assert.deepEqual(Object.keys(errores).sort(), ['codigoInstitucional', 'correo', 'nombre', 'password']);
  assert.deepEqual(
    validarRegistro({
      codigoInstitucional: 'U20261045',
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@universidad.edu',
      password: 'Password123',
    }),
    {},
  );
});

test('formatearContador muestra actual / maximo', () => {
  assert.equal(formatearContador(38, 500), '38 / 500');
});

test('validarTitulo: limites exactos 4/5/150/151', () => {
  assert.ok(validarTitulo('x'.repeat(4)));
  assert.equal(validarTitulo('x'.repeat(5)), null);
  assert.equal(validarTitulo('x'.repeat(150)), null);
  assert.ok(validarTitulo('x'.repeat(151)));
});

test('validarDescripcion: limites exactos 14/15/500/501', () => {
  assert.ok(validarDescripcion('x'.repeat(14)));
  assert.equal(validarDescripcion('x'.repeat(15)), null);
  assert.equal(validarDescripcion('x'.repeat(500)), null);
  assert.ok(validarDescripcion('x'.repeat(501)));
});

test('contarCaracteres usa la longitud recortada, igual que validarDescripcion', () => {
  const texto = `  ${'x'.repeat(15)}  `;
  assert.equal(contarCaracteres(texto), 15);
  assert.equal(validarDescripcion(texto), null);
  assert.equal(contarCaracteres(undefined), 0);
});
