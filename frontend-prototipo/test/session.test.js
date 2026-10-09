import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearSesion, CLAVE_SESION } from '../js/lib/session.js';

function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
const roto = {
  getItem() { throw new Error('bloqueado'); },
  setItem() { throw new Error('bloqueado'); },
  removeItem() { throw new Error('bloqueado'); },
};
const auth = { token: 't', tipo: 'Bearer', expiraEn: 28800, usuario: { id: 7, rol: 'ESTUDIANTE' } };

test('la clave es la del ADR-004', () => {
  assert.equal(CLAVE_SESION, 'gestion_univ_auth');
});

test('guardar y leer ida y vuelta', () => {
  const s = crearSesion(memoria());
  assert.equal(s.leer(), null);
  s.guardar(auth);
  assert.deepEqual(s.leer(), auth);
  s.limpiar();
  assert.equal(s.leer(), null);
});

test('JSON corrupto o sin forma valida devuelve null', () => {
  const st = memoria();
  const s = crearSesion(st);
  st.setItem(CLAVE_SESION, '{no es json');
  assert.equal(s.leer(), null);
  st.setItem(CLAVE_SESION, JSON.stringify({ foo: 1 }));
  assert.equal(s.leer(), null);
});

test('almacenamiento bloqueado no lanza', () => {
  const s = crearSesion(roto);
  assert.equal(s.leer(), null);
  assert.doesNotThrow(() => s.guardar(auth));
  assert.doesNotThrow(() => s.limpiar());
});

test('almacenamiento ausente (undefined) no lanza', () => {
  const s = crearSesion(undefined);
  assert.equal(s.leer(), null);
});
