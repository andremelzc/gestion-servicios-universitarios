import { describe, expect, it } from 'vitest';
import * as chartUtils from '../../features/dashboard/chartUtils.js';
import { colorEstado, etiquetaEstado, etiquetaPrioridad, hexValido } from './catalogos.js';

describe('catalogos compartidos', () => {
  it('[US-21] chartUtils reexporta los mismos helpers (sin duplicar)', () => {
    expect(chartUtils.etiquetaPrioridad).toBe(etiquetaPrioridad);
    expect(chartUtils.etiquetaEstado).toBe(etiquetaEstado);
    expect(chartUtils.colorEstado).toBe(colorEstado);
  });

  it('[US-21] hexValido solo acepta #RRGGBB exacto', () => {
    expect(hexValido('#D97706')).toBe('#D97706');
    expect(hexValido('#d97706')).toBe('#d97706');
    for (const malo of ['#FFF', '#GGGGGG', '#D97706\n', 'D97706', '', null, undefined, 42]) {
      expect(hexValido(malo)).toBeNull();
    }
  });
});
