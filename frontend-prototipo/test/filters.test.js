import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarSolicitudes, paginar, GRUPOS_ESTADO } from '../js/lib/filters.js';

const datos = [
  { codigo: 'SOL-2026-0150', titulo: 'Proyector sin imagen', estado: 'ASIGNADA', prioridad: 'ALTA' },
  { codigo: 'SOL-2026-0141', titulo: 'Wi-Fi caído en laboratorio', estado: 'CERRADA', prioridad: 'MEDIA' },
  { codigo: 'SOL-2026-0148', titulo: 'Señal Wi-Fi débil', estado: 'REGISTRADA', prioridad: 'CRITICA' },
];

test('sin filtros devuelve todo', () => {
  assert.equal(filtrarSolicitudes(datos, {}).length, 3);
});

test('filtra por estado y prioridad', () => {
  assert.deepEqual(filtrarSolicitudes(datos, { estado: 'CERRADA' }).map((s) => s.codigo), ['SOL-2026-0141']);
  assert.deepEqual(filtrarSolicitudes(datos, { prioridad: 'CRITICA' }).map((s) => s.codigo), ['SOL-2026-0148']);
});

test('busqueda por codigo o titulo, sin mayusculas ni acentos', () => {
  assert.equal(filtrarSolicitudes(datos, { q: 'wi-fi' }).length, 2);
  assert.equal(filtrarSolicitudes(datos, { q: 'senal' }).length, 1);
  assert.equal(filtrarSolicitudes(datos, { q: '0150' }).length, 1);
  assert.equal(filtrarSolicitudes(datos, { q: '  proyector ' }).length, 1);
});

test('los filtros se combinan', () => {
  assert.equal(filtrarSolicitudes(datos, { q: 'wifi', estado: 'CERRADA' }).length, 0);
  assert.equal(filtrarSolicitudes(datos, { q: 'wi-fi', estado: 'CERRADA' }).length, 1);
});

test('estado acepta un grupo (varios estados)', () => {
  const r = filtrarSolicitudes(datos, { estados: GRUPOS_ESTADO.porAsignar });
  assert.deepEqual(r.map((s) => s.estado), ['REGISTRADA']);
});

test('no muta la entrada', () => {
  const copia = structuredClone(datos);
  filtrarSolicitudes(datos, { q: 'x' });
  assert.deepEqual(datos, copia);
});

test('paginar usa la forma Page<T> del contrato', () => {
  const items = Array.from({ length: 11 }, (_, i) => i);
  const p = paginar(items, 1, 5);
  assert.deepEqual(p, { content: [5, 6, 7, 8, 9], page: 1, size: 5, totalElements: 11, totalPages: 3 });
  assert.deepEqual(paginar([], 0, 5).totalPages, 0);
  assert.deepEqual(paginar(items, 99, 5).page, 2);
});
