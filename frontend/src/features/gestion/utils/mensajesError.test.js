import { describe, expect, it } from 'vitest';
import { interpretarError } from './mensajesError.js';

describe('interpretarError', () => {
  it('[US-08 CA-4] sin error no hay mensaje ni errores por campo', () => {
    expect(interpretarError(null)).toEqual({ general: null, campos: {} });
  });

  it.each([
    [403, 'No tienes permiso para realizar esta acción.'],
    [404, 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.'],
    [409, 'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.'],
  ])('[US-08 CA-3] %i usa el microcopy de UX §9 y no el texto del servidor', (status, mensaje) => {
    const resultado = interpretarError({ status, detail: 'texto del servidor', errores: null });

    expect(resultado).toEqual({ general: mensaje, campos: {} });
  });

  it('[US-08 CA-4] 400 con errores conserva el mapa por campo', () => {
    const errores = { idTecnico: 'Requerido', nota: 'Muy larga' };

    const resultado = interpretarError({ status: 400, detail: 'Hay errores.', errores });

    expect(resultado).toEqual({ general: null, campos: errores });
  });

  it('[US-08 CA-4] 400 con campos desconocidos los junta en el mensaje general', () => {
    const resultado = interpretarError({
      status: 400,
      detail: 'Hay errores.',
      errores: { idTecnico: 'Requerido', otro: 'Dato inválido' },
    });

    expect(resultado.general).toBe('Dato inválido');
  });

  it('[US-08 CA-4] 400 sin errores por campo muestra el detalle de la regla incumplida', () => {
    const resultado = interpretarError({
      status: 400,
      detail: 'Técnico de otra área.',
      errores: null,
    });

    expect(resultado).toEqual({ general: 'Técnico de otra área.', campos: {} });
  });

  it('[UX §9] un error inesperado informa el código de soporte', () => {
    const resultado = interpretarError({ status: 500, detail: 'boom', traceId: '4bf92f35' });

    expect(resultado.general).toBe(
      'Ocurrió un error inesperado. Si persiste, informa este código de soporte: 4bf92f35.',
    );
  });

  it('[UX §9] un error inesperado sin traceId pide reintentar', () => {
    const resultado = interpretarError({ status: 500, detail: 'boom' });

    expect(resultado.general).toBe(
      'Ocurrió un error inesperado. Si persiste, vuelve a intentarlo más tarde.',
    );
  });
});
