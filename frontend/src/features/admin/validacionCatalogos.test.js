import { describe, expect, it } from 'vitest';
import { validarArea, validarCategoria } from './validacionCatalogos.js';

describe('validarCategoria (api-rest §3.5, US-15)', () => {
  const valida = {
    nombre: ' Conectividad Wi-Fi ',
    descripcion: '',
    idArea: '1',
    tiempoSlaHoras: '24',
  };

  it('[US-15] normaliza: recorta, descripción vacía como null y números como número', () => {
    expect(validarCategoria(valida)).toEqual({
      datos: { nombre: 'Conectividad Wi-Fi', descripcion: null, idArea: 1, tiempoSlaHoras: 24 },
    });
  });

  it('[US-15] exige el nombre y limita su largo (80) y el de la descripción (255)', () => {
    expect(validarCategoria({ ...valida, nombre: ' ' }).errores.nombre).toBe(
      'Ingresa el nombre de la categoría.',
    );
    expect(validarCategoria({ ...valida, nombre: 'A'.repeat(81) }).errores.nombre).toBe(
      'El nombre admite hasta 80 caracteres.',
    );
    expect(validarCategoria({ ...valida, descripcion: 'A'.repeat(256) }).errores.descripcion).toBe(
      'La descripción admite hasta 255 caracteres.',
    );
  });

  it('[US-15] exige un área responsable', () => {
    expect(validarCategoria({ ...valida, idArea: '' }).errores.idArea).toBe(
      'Selecciona el área responsable.',
    );
  });

  it.each(['', '0', '-3', '1.5', 'abc'])('[US-15] rechaza el SLA "%s"', (tiempoSlaHoras) => {
    expect(validarCategoria({ ...valida, tiempoSlaHoras }).errores.tiempoSlaHoras).toBeTruthy();
  });

  it('[US-15] el SLA no puede superar el máximo de un INT', () => {
    expect(
      validarCategoria({ ...valida, tiempoSlaHoras: '2147483648' }).errores.tiempoSlaHoras,
    ).toBe('El SLA no puede superar 2147483647 horas.');
  });
});

describe('validarArea (api-rest §3.5, US-16)', () => {
  const valida = { nombre: ' Mantenimiento ', correoContacto: ' mant@uni.edu ' };

  it('[US-16] recorta nombre y correo', () => {
    expect(validarArea(valida)).toEqual({
      datos: { nombre: 'Mantenimiento', correoContacto: 'mant@uni.edu' },
    });
  });

  it('[US-16] exige el nombre (hasta 100) y un correo válido (hasta 100)', () => {
    expect(validarArea({ ...valida, nombre: '' }).errores.nombre).toBe(
      'Ingresa el nombre del área.',
    );
    expect(validarArea({ ...valida, nombre: 'A'.repeat(101) }).errores.nombre).toBe(
      'El nombre admite hasta 100 caracteres.',
    );
    expect(validarArea({ ...valida, correoContacto: '' }).errores.correoContacto).toBe(
      'Ingresa el correo de contacto.',
    );
    expect(validarArea({ ...valida, correoContacto: 'sin-arroba' }).errores.correoContacto).toBe(
      'Ingresa un correo válido.',
    );
  });
});
