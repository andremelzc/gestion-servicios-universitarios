import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarError, ApiError } from '../js/lib/errors.js';

test('RFC 7807 400 conserva el mapa errores', () => {
  const e = normalizarError(400, {
    title: 'Solicitud inválida',
    status: 400,
    detail: 'Hay campos inválidos',
    errores: { correo: 'Formato inválido' },
    traceId: 'abc',
  });
  assert.equal(e.status, 400);
  assert.deepEqual(e.errores, { correo: 'Formato inválido' });
  assert.equal(e.traceId, 'abc');
});

test('401 en login usa el microcopy de credenciales', () => {
  const e = normalizarError(401, { detail: 'Credenciales inválidas' }, { contexto: 'login' });
  assert.equal(e.mensaje, 'Credenciales inválidas. Verifica tu correo y contraseña.');
});

test('401 fuera del login es sesion expirada', () => {
  assert.equal(normalizarError(401, {}).mensaje, 'Tu sesión expiró. Inicia sesión de nuevo.');
});

test('409 de transicion usa el microcopy; otro 409 usa el detail', () => {
  assert.equal(
    normalizarError(409, { type: 'https://x/problemas/transicion-invalida', detail: 'x' }).mensaje,
    'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.',
  );
  assert.equal(
    normalizarError(409, { type: 'https://x/problemas/duplicado', detail: 'Ya existe una solicitud igual.' }).mensaje,
    'Ya existe una solicitud igual.',
  );
});

test('403, 404, 429 usan microcopy', () => {
  assert.equal(normalizarError(403, {}).mensaje, 'No tienes permiso para realizar esta acción.');
  assert.match(normalizarError(404, {}).mensaje, /No encontramos esa solicitud/);
  assert.match(normalizarError(429, {}).mensaje, /Demasiados intentos/);
});

test('500 incluye el traceId como codigo de soporte', () => {
  const e = normalizarError(500, { traceId: 'T-123' });
  assert.match(e.mensaje, /T-123/);
});

test('cuerpo no JSON o vacio no rompe', () => {
  const e = normalizarError(500, null);
  assert.equal(e.status, 500);
  assert.deepEqual(e.errores, {});
  assert.equal(e.traceId, null);
});

test('status 0 es sin conexion', () => {
  assert.equal(
    normalizarError(0, null).mensaje,
    'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
  );
});

test('ApiError es un Error con el problema normalizado', () => {
  const err = new ApiError(normalizarError(404, {}));
  assert.ok(err instanceof Error);
  assert.equal(err.status, 404);
  assert.equal(err.message, err.problema.mensaje);
});
