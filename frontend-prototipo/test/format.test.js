import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatearEntero,
  formatearPorcentaje,
  formatearHoras,
  formatearTamano,
  formatearFechaLima,
  tiempoRelativo,
  calcularBarras,
  calcularSegmentosDona,
  formatearKpis,
  DONA,
  radioExterno,
  VARIABLE_COLOR_PRIORIDAD,
} from '../js/lib/format.js';

test('formatearPorcentaje con un decimal', () => {
  assert.equal(formatearPorcentaje(70.5), '70.5 %');
  assert.equal(formatearPorcentaje(100), '100.0 %');
  assert.equal(formatearPorcentaje(null), '—');
});

test('formatearHoras: null es raya (sin resueltas)', () => {
  assert.equal(formatearHoras(24.5), '24.5 h');
  assert.equal(formatearHoras(null), '—');
});

test('formatearEntero', () => {
  assert.equal(formatearEntero(150), '150');
  assert.equal(formatearEntero(undefined), '—');
});

test('formatearTamano', () => {
  assert.equal(formatearTamano(1534021), '1.5 MB');
  assert.equal(formatearTamano(2048), '2 KB');
  assert.equal(formatearTamano(12), '12 B');
});

test('formatearFechaLima convierte UTC a America/Lima (UTC-5)', () => {
  assert.equal(formatearFechaLima('2026-10-03T15:04:05Z'), '03/10/2026 10:04');
});

test('tiempoRelativo en español', () => {
  const ahora = new Date('2026-10-03T17:04:05Z');
  assert.equal(tiempoRelativo('2026-10-03T15:04:05Z', ahora), 'hace 2 h');
  assert.equal(tiempoRelativo('2026-10-03T17:00:05Z', ahora), 'hace 4 min');
  assert.equal(tiempoRelativo('2026-10-01T17:04:05Z', ahora), 'hace 2 d');
  assert.equal(tiempoRelativo('2026-10-03T17:04:00Z', ahora), 'hace un momento');
});

test('calcularBarras: porcentaje relativo al maximo', () => {
  const r = calcularBarras([{ nombre: 'A', valor: 20 }, { nombre: 'B', valor: 10 }, { nombre: 'C', valor: 0 }]);
  assert.deepEqual(r.map((b) => b.porcentaje), [100, 50, 0]);
  assert.deepEqual(calcularBarras([]), []);
  assert.equal(calcularBarras([{ nombre: 'A', valor: 0 }])[0].porcentaje, 0);
});

test('calcularSegmentosDona: porcentajes suman 100 y offsets acumulan', () => {
  const r = calcularSegmentosDona([{ nombre: 'A', valor: 30 }, { nombre: 'B', valor: 10 }], 15.9155);
  assert.equal(r[0].porcentaje, 75);
  assert.equal(r[1].porcentaje, 25);
  assert.equal(r[0].inicio, 0);
  assert.equal(r[1].inicio, 75);
  assert.deepEqual(calcularSegmentosDona([], 15.9), []);
  assert.deepEqual(calcularSegmentosDona([{ nombre: 'A', valor: 0 }], 15.9)[0].porcentaje, 0);
});

test('formatearKpis produce las 6 tarjetas del dashboard', () => {
  const k = formatearKpis({
    registradas: 150, pendientes: 45, atendidas: 98, porcentajeResueltas: 70.5, mttrHoras: 24.5, vencidas: 7,
  });
  assert.equal(k.length, 6);
  assert.deepEqual(k.map((x) => x.valor), ['150', '45', '98', '70.5 %', '24.5 h', '7']);
  assert.equal(k[0].etiqueta, 'Registradas');
  assert.equal(formatearKpis({}).length, 6);
});

test('la dona cabe en su viewBox: el radio exterior no supera la mitad del lienzo', () => {
  assert.equal(DONA.viewBox, `0 0 ${DONA.tamano} ${DONA.tamano}`);
  assert.equal(DONA.centro * 2, DONA.tamano);
  assert.ok(radioExterno() <= DONA.tamano / 2, `radio exterior ${radioExterno()}`);
  // la circunferencia normalizada a 100 sigue siendo exacta
  assert.ok(Math.abs(2 * Math.PI * DONA.radio - 100) < 0.01);
});

test('cada prioridad tiene su variable de color (la misma que su etiqueta)', () => {
  assert.deepEqual(Object.keys(VARIABLE_COLOR_PRIORIDAD).sort(), ['ALTA', 'BAJA', 'CRITICA', 'MEDIA']);
  assert.equal(VARIABLE_COLOR_PRIORIDAD.CRITICA, '--color-danger');
  assert.equal(VARIABLE_COLOR_PRIORIDAD.ALTA, '--color-warning');
  assert.equal(new Set(Object.values(VARIABLE_COLOR_PRIORIDAD)).size, 4);
});
