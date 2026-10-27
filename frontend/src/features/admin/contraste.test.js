import { describe, expect, it } from 'vitest';
import { avisoContraste, razonContraste } from './contraste.js';

describe('razonContraste (WCAG 2.1, fórmula de luminancia relativa)', () => {
  it('negro sobre blanco es 21:1 y un color sobre sí mismo es 1:1', () => {
    expect(razonContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(razonContraste('#2563EB', '#2563EB')).toBeCloseTo(1, 5);
  });

  it('no distingue mayúsculas de minúsculas ni el orden de los colores', () => {
    expect(razonContraste('#d97706', '#ffffff')).toBeCloseTo(
      razonContraste('#FFFFFF', '#D97706'),
      5,
    );
  });
});

describe('avisoContraste (US-32, CA-7)', () => {
  it('los colores del sistema de diseño sobre blanco no generan aviso', () => {
    expect(avisoContraste('#2563EB')).toBeNull();
    expect(avisoContraste('#047857')).toBeNull();
  });

  it('un color claro avisa con la razón calculada', () => {
    expect(avisoContraste('#FFFF00')).toBe(
      'Este color tiene poco contraste con el fondo blanco (1.1:1). Se recomienda al menos 3:1 para que el estado se distinga.',
    );
  });

  it('un color incompleto o inválido no genera aviso (lo valida el formulario)', () => {
    expect(avisoContraste('#FF')).toBeNull();
    expect(avisoContraste('rojo')).toBeNull();
  });
});
