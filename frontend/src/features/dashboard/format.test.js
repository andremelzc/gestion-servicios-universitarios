import { describe, expect, it } from 'vitest';
import { SIN_DATO, describirRango, formatNumero } from './format.js';

describe('describirRango', () => {
  it('[US-12 UAT-10] sin fechas describe el rango por defecto del backend', () => {
    expect(describirRango({ desde: '', hasta: '' })).toBe('últimos 30 días');
    expect(describirRango()).toBe('últimos 30 días');
  });

  it('[US-12 UAT-10] con ambas fechas muestra "del dd/mm/aaaa al dd/mm/aaaa"', () => {
    expect(describirRango({ desde: '2026-10-01', hasta: '2026-10-03' })).toBe(
      'del 01/10/2026 al 03/10/2026',
    );
  });

  it('[US-12 UAT-10] solo Desde: hasta hoy (hasta = hoy en el backend)', () => {
    expect(describirRango({ desde: '2026-10-01', hasta: '' })).toBe(
      'desde el 01/10/2026 hasta hoy',
    );
  });

  it('[US-12 UAT-10] solo Hasta: los 30 días que terminan ese día (desde = hasta - 29)', () => {
    expect(describirRango({ desde: '', hasta: '2026-10-03' })).toBe(
      'los 30 días hasta el 03/10/2026',
    );
  });
});

describe('formatNumero', () => {
  it('[US-12 CA-1] formatea enteros con separador de miles es-PE', () => {
    expect(formatNumero(150)).toBe('150');
    expect(formatNumero(1500)).toBe('1,500');
  });

  it('[US-12 CA-1] conserva un decimal como máximo (70.5, 66.7)', () => {
    expect(formatNumero(70.5)).toBe('70.5');
    expect(formatNumero(66.666)).toBe('66.7');
  });

  it('[US-12 CA-11] devuelve "—" para null y undefined', () => {
    expect(SIN_DATO).toBe('—');
    expect(formatNumero(null)).toBe('—');
    expect(formatNumero(undefined)).toBe('—');
  });

  it('[US-12 CA-11] el cero es un valor válido, no un dato ausente', () => {
    expect(formatNumero(0)).toBe('0');
  });

  it('[US-12 CA-11] devuelve "—" para valores no numéricos', () => {
    expect(formatNumero(NaN)).toBe('—');
    expect(formatNumero('abc')).toBe('—');
    expect(formatNumero(Infinity)).toBe('—');
  });
});
