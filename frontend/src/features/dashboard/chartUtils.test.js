import { describe, expect, it } from 'vitest';
import {
  COLOR_NEUTRO,
  coloresCategorias,
  colorEstado,
  colorPrioridad,
  etiquetaEstado,
  etiquetaPrioridad,
  formatPorcentaje,
  formatValor,
  ordenarPorValorDesc,
  porcentaje,
  totalDatos,
} from './chartUtils.js';

describe('chartUtils', () => {
  it('[US-13 CA-5] totalDatos suma los valores y tolera null o vacío', () => {
    expect(totalDatos([{ valor: 30 }, { valor: 18 }, { valor: 2 }])).toBe(50);
    expect(totalDatos([])).toBe(0);
    expect(totalDatos(null)).toBe(0);
    expect(totalDatos(undefined)).toBe(0);
  });

  it('[US-13 CA-5] porcentaje usa un decimal y devuelve 0 si el total es 0', () => {
    expect(porcentaje(100, 150)).toBe(66.7);
    expect(porcentaje(30, 60)).toBe(50);
    expect(porcentaje(5, 0)).toBe(0);
  });

  it('[US-13 CA-5] formatPorcentaje formatea en es-PE con el símbolo %', () => {
    expect(formatPorcentaje(66.7)).toBe('66.7 %');
    expect(formatPorcentaje(0)).toBe('0 %');
  });

  it('[US-13 CA-5] formatValor usa separador de miles es-PE', () => {
    expect(formatValor(30)).toBe('30');
    expect(formatValor(2000)).toBe('2,000');
    expect(formatValor(0)).toBe('0');
  });

  it('[US-13 CA-5] coloresCategorias asigna colores distintos a las primeras categorías', () => {
    const colores = coloresCategorias(6);
    expect(new Set(colores).size).toBe(6);
    colores.forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/i));
    expect(coloresCategorias(0)).toEqual([]);
  });

  it('[US-13 CA-5] coloresCategorias nunca deja dos colores iguales contiguos, ni siquiera entre la última y la primera (dona)', () => {
    for (let n = 2; n <= 40; n++) {
      const colores = coloresCategorias(n);
      expect(colores).toHaveLength(n);
      for (let i = 0; i < n; i++) {
        expect(colores[i], `n=${n} i=${i}`).not.toBe(colores[(i + 1) % n]);
      }
    }
  });

  it('[US-28 CA-6] etiquetaPrioridad muestra Baja/Media/Alta/Crítica y humaniza los desconocidos', () => {
    expect(etiquetaPrioridad('BAJA')).toBe('Baja');
    expect(etiquetaPrioridad('MEDIA')).toBe('Media');
    expect(etiquetaPrioridad('ALTA')).toBe('Alta');
    expect(etiquetaPrioridad('CRITICA')).toBe('Crítica');
    expect(etiquetaPrioridad('Crítica')).toBe('Crítica');
    expect(etiquetaPrioridad('URGENTE')).toBe('Urgente');
  });

  it('[US-28 CA-6] colorPrioridad usa un color propio por nivel, sin importar mayúsculas ni tildes', () => {
    const colores = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map(colorPrioridad);
    expect(new Set(colores).size).toBe(4);
    expect(colorPrioridad('Crítica')).toBe(colorPrioridad('CRITICA'));
    expect(colorPrioridad('alta')).toBe(colorPrioridad('ALTA'));
    expect(colorPrioridad('desconocida')).toBe(COLOR_NEUTRO);
  });

  it('[US-28 CA-6] colorEstado respeta colorHex válido y cae a neutro si falta o es inválido', () => {
    expect(colorEstado('#7C3AED')).toBe('#7C3AED');
    expect(colorEstado(undefined)).toBe(COLOR_NEUTRO);
    expect(colorEstado('red')).toBe(COLOR_NEUTRO);
    expect(colorEstado('#7C3AED; background:url(x)')).toBe(COLOR_NEUTRO);
  });

  it('[US-28 CA-6] etiquetaEstado traduce los códigos del catálogo y humaniza los desconocidos', () => {
    expect(etiquetaEstado('EN_ATENCION')).toBe('En atención');
    expect(etiquetaEstado('EN_EVALUACION')).toBe('En evaluación');
    expect(etiquetaEstado('REGISTRADA')).toBe('Registrada');
    expect(etiquetaEstado('EN_REVISION_X')).toBe('En revision x');
  });

  it('[US-30 CA-9] ordenarPorValorDesc ordena de mayor a menor sin mutar la entrada', () => {
    const entrada = [
      { nombre: 'Lucía Vega', valor: 11 },
      { nombre: 'Carlos Ruiz', valor: 18 },
    ];
    const salida = ordenarPorValorDesc(entrada);
    expect(salida.map((d) => d.nombre)).toEqual(['Carlos Ruiz', 'Lucía Vega']);
    expect(entrada[0].nombre).toBe('Lucía Vega');
    expect(ordenarPorValorDesc(null)).toEqual([]);
  });
});
