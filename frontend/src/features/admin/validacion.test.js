import { describe, expect, it } from 'vitest';
import { validarPrioridad } from './validacion.js';

describe('validarPrioridad (api-rest §3.5, US-31)', () => {
  it('[US-31] acepta valores correctos y devuelve números', () => {
    expect(validarPrioridad({ nivel: ' URGENTE ', ponderador: '5', slaMaxHoras: '12' })).toEqual({
      datos: { nivel: 'URGENTE', ponderador: 5, slaMaxHoras: 12 },
    });
  });

  it('[US-31] normaliza el nivel (código de dominio) a mayúsculas', () => {
    const { datos } = validarPrioridad({ nivel: 'urgente', ponderador: '5', slaMaxHoras: '12' });

    expect(datos.nivel).toBe('URGENTE');
  });

  it('[US-31] acota urgencia y SLA al máximo de un INT (2147483647)', () => {
    const ok = validarPrioridad({
      nivel: 'A',
      ponderador: '2147483647',
      slaMaxHoras: '2147483647',
    });
    expect(ok.datos).toMatchObject({ ponderador: 2147483647, slaMaxHoras: 2147483647 });

    const { errores } = validarPrioridad({
      nivel: 'A',
      ponderador: '2147483648',
      slaMaxHoras: '99999999999',
    });
    expect(errores.ponderador).toBe('La urgencia no puede superar 2147483647.');
    expect(errores.slaMaxHoras).toBe('El SLA no puede superar 2147483647 horas.');
  });

  it('[US-31] exige nivel, ponderador y SLA', () => {
    const { errores } = validarPrioridad({ nivel: ' ', ponderador: '', slaMaxHoras: '' });

    expect(errores).toEqual({
      nivel: 'Ingresa el nivel de la prioridad.',
      ponderador: 'Ingresa la urgencia como número entero (1 o más).',
      slaMaxHoras: 'Ingresa el SLA en horas.',
    });
  });

  it.each(['0', '-3', '1.5', '2e1', 'abc'])('[US-31] rechaza un SLA de "%s"', (valor) => {
    const { errores } = validarPrioridad({ nivel: 'ALTA', ponderador: '3', slaMaxHoras: valor });

    expect(errores.slaMaxHoras).toBe('El SLA debe ser un número entero de horas mayor que 0.');
  });

  it('[US-31] limita el nivel a 20 caracteres (VARCHAR(20))', () => {
    const { errores } = validarPrioridad({
      nivel: 'A'.repeat(21),
      ponderador: '1',
      slaMaxHoras: '1',
    });

    expect(errores.nivel).toBe('El nivel admite hasta 20 caracteres.');
  });
});
