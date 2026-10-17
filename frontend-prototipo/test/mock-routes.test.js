import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolver } from '../mock/routes.js';

const db = {
  usuarios: [{ id: 7, password: 'secreto' }],
  areas: [{ id: 1, nombre: 'TI', activo: true }, { id: 2, nombre: 'Viejo', activo: false }],
  categorias: [{ id: 1, nombre: 'Redes', activo: true }],
  prioridades: [{ id: 1, nombre: 'BAJA', activo: true }],
  estados: [{ codigo: 'REGISTRADA' }],
  campus: [{ id: 1, nombre: 'Campus Central', activo: true }],
  solicitudes: [
    { id: 1, codigo: 'SOL-1', area: 'TI', tecnico: 'Carlos Ruiz', solicitanteId: 7, fechaRegistro: '2026-10-01T00:00:00Z' },
    { id: 2, codigo: 'SOL-2', area: 'TI', tecnico: null, solicitanteId: 9, fechaRegistro: '2026-10-02T00:00:00Z' },
    { id: 3, codigo: 'SOL-3', area: 'Otra', tecnico: 'Lucía Vega', solicitanteId: 9, fechaRegistro: '2026-10-03T00:00:00Z' },
  ],
  dashboardKpis: { registradas: 3 },
  dashboardPorCategoria: [{ nombre: 'Redes', valor: 3 }],
  dashboardPorPrioridad: [],
  dashboardPorEstado: [],
  dashboardPorResponsable: [],
};
const estudiante = { id: 7, nombre: 'Juan', apellido: 'Pérez', rol: 'ESTUDIANTE', idArea: null, password: 'x' };
const tecnico = { id: 14, nombre: 'Carlos', apellido: 'Ruiz', rol: 'TECNICO', idArea: 1 };
const supervisor = { id: 3, nombre: 'Ana', apellido: 'Torres', rol: 'SUPERVISOR', idArea: 1 };
const admin = { id: 1, nombre: 'Marco', apellido: 'Salas', rol: 'ADMIN', idArea: null };
const get = (usuario, ruta, extra = {}) => resolver({ db, usuario, metodo: 'GET', ruta, query: {}, ...extra });

test('rutas desconocidas dan 404 problem+json, no {}', () => {
  for (const ruta of ['/usuarios', '/dashboardKpis', '/db', '/solicitudes/abc/x']) {
    const r = get(admin, ruta);
    assert.equal(r.status, 404, ruta);
    assert.equal(r.body.status, 404);
    assert.match(r.body.type, /no-encontrado$/);
  }
});

test('el estudiante no ve usuarios ni contraseñas', () => {
  assert.equal(get(estudiante, '/usuarios').status, 404);
  assert.doesNotMatch(JSON.stringify(get(estudiante, '/usuarios').body), /secreto/);
});

test('metodos distintos de GET responden 405 problem', () => {
  const r = resolver({ db, usuario: admin, metodo: 'DELETE', ruta: '/solicitudes/1', query: {} });
  assert.equal(r.status, 405);
  assert.equal(r.body.status, 405);
});

test('catalogos devuelven solo activos', () => {
  assert.deepEqual(get(estudiante, '/areas').body.map((a) => a.id), [1]);
  assert.equal(get(estudiante, '/campus').status, 200);
  assert.equal(get(estudiante, '/estados').body.length, 1);
});

test('detalle de solicitud respeta el alcance (RN-16): fuera de alcance es 404', () => {
  assert.equal(get(estudiante, '/solicitudes/1').status, 200);
  assert.equal(get(estudiante, '/solicitudes/2').status, 404);
  assert.equal(get(tecnico, '/solicitudes/1').status, 200);
  assert.equal(get(tecnico, '/solicitudes/2').status, 404);
  assert.equal(get(supervisor, '/solicitudes/2').status, 200);
  assert.equal(get(supervisor, '/solicitudes/3').status, 404);
  assert.equal(get(admin, '/solicitudes/3').status, 200);
  assert.equal(get(admin, '/solicitudes/99').status, 404);
});

test('el detalle no expone campos privados', () => {
  assert.equal('solicitanteId' in get(admin, '/solicitudes/1').body, false);
});

test('mis-solicitudes devuelve Page solo con las propias', () => {
  const r = get(estudiante, '/solicitudes/mis-solicitudes');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.content.map((s) => s.id), [1]);
  assert.equal(r.body.totalElements, 1);
  assert.equal(get(estudiante, '/solicitudes/mis-solicitudes', { vacio: true }).body.totalElements, 0);
});

test('bandeja: estudiante 403; tecnico, supervisor y admin con su alcance', () => {
  assert.equal(get(estudiante, '/solicitudes').status, 403);
  assert.deepEqual(get(tecnico, '/solicitudes').body.content.map((s) => s.id), [1]);
  assert.deepEqual(get(supervisor, '/solicitudes').body.content.map((s) => s.id), [2, 1]);
  assert.equal(get(admin, '/solicitudes').body.totalElements, 3);
});

test('paginacion respeta size y page', () => {
  const r = get(admin, '/solicitudes', { query: { size: '2', page: '1' } });
  assert.equal(r.body.content.length, 1);
  assert.equal(r.body.totalPages, 2);
});

test('dashboard: 403 al estudiante, datos a los demas roles', () => {
  assert.equal(get(estudiante, '/dashboard/kpis').status, 403);
  assert.equal(get(estudiante, '/dashboard/por-categoria').status, 403);
  assert.equal(get(tecnico, '/dashboard/kpis').body.registradas, 3);
  assert.equal(get(admin, '/dashboard/por-categoria').body.length, 1);
  assert.equal(get(admin, '/dashboard/inexistente').status, 404);
});

test('auth/me devuelve el perfil sin password', () => {
  const r = get(estudiante, '/auth/me');
  assert.equal(r.status, 200);
  assert.equal(r.body.password, undefined);
  assert.equal(r.body.rol, 'ESTUDIANTE');
});
