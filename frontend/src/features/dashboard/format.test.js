import { describe, expect, it } from 'vitest';
import { SIN_DATO, formatNumero } from './format.js';

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
});
