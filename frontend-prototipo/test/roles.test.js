import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rutaInicial, menuPara, puedeVer } from '../js/lib/roles.js';

test('redireccion por rol (UX §4.1)', () => {
  assert.equal(rutaInicial('ESTUDIANTE'), 'mis-solicitudes.html');
  assert.equal(rutaInicial('TECNICO'), 'bandeja.html');
  assert.equal(rutaInicial('SUPERVISOR'), 'bandeja.html');
  assert.equal(rutaInicial('ADMIN'), 'dashboard.html');
  assert.equal(rutaInicial('OTRO'), 'login.html');
});

test('menu por rol (UX §3)', () => {
  const etiquetas = (rol) => menuPara(rol).map((i) => i.etiqueta);
  assert.deepEqual(etiquetas('ESTUDIANTE'), ['Mis solicitudes', 'Nueva solicitud']);
  assert.deepEqual(etiquetas('TECNICO'), ['Mis solicitudes', 'Nueva solicitud', 'Bandeja', 'Dashboard']);
  assert.deepEqual(etiquetas('ADMIN'), etiquetas('SUPERVISOR'));
});

test('puedeVer protege bandeja y dashboard del estudiante', () => {
  assert.equal(puedeVer('ESTUDIANTE', 'bandeja.html'), false);
  assert.equal(puedeVer('ESTUDIANTE', 'dashboard.html'), false);
  assert.equal(puedeVer('ESTUDIANTE', 'nueva-solicitud.html'), true);
  assert.equal(puedeVer('TECNICO', 'dashboard.html'), true);
});
