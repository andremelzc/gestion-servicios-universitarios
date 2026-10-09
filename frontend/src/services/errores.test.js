import { describe, expect, it } from 'vitest';
import { interpretarError } from './errores.js';

const INESPERADO = 'Ocurrió un error inesperado.';
const TRANSICION =
  'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.';

// Tabla compartida con DataTable (`textoDeError`, PR #228): mismos textos de UX §9 para la misma entrada.
// La única diferencia consciente es el 409 (ver las pruebas de abajo).
const CASOS_COMUNES = [
  ['status 0', { status: 0 }, 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.'],
  [
    'sinConexion',
    { sinConexion: true },
    'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
  ],
  ['401', { status: 401, detail: 'x' }, INESPERADO],
  ['403', { status: 403, detail: 'x' }, 'No tienes permiso para realizar esta acción.'],
  [
    '404',
    { status: 404 },
    'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.',
  ],
  ['429', { status: 429 }, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'],
  ['500 sin traceId', { status: 500, detail: 'boom' }, INESPERADO],
  [
    '503 con traceId',
    { status: 503, traceId: '4bf92f35' },
    `${INESPERADO} Si persiste, informa este código de soporte: 4bf92f35.`,
  ],
  [
    'otro con detail',
    { status: 413, detail: 'Archivo demasiado grande.' },
    'Archivo demasiado grande.',
  ],
  ['otro sin detail', { status: 418 }, INESPERADO],
  [
    '400 sin errores por campo',
    { status: 400, detail: 'Técnico de otra área.' },
    'Técnico de otra área.',
  ],
];

describe('interpretarError', () => {
  it('[US-08 CA-4] sin error no hay mensaje ni errores por campo', () => {
    expect(interpretarError(null)).toEqual({ general: null, campos: {} });
  });

  it.each(CASOS_COMUNES)('[UX §9] %s', (_nombre, error, general) => {
    expect(interpretarError(error)).toEqual({ general, campos: {} });
  });

  it.todo('DataTable debe usar services/errores.js (seguimiento tras el PR #228)');

  it('[US-08 CA-12] 409 de transición inválida usa el microcopy de UX §9', () => {
    const error = { status: 409, tipo: 'transicion-invalida', detail: 'La solicitud debe estar X' };

    expect(interpretarError(error).general).toBe(TRANSICION);
  });

  it('[US-08 CA-4] 409 por regla de negocio muestra el detalle del servidor', () => {
    const error = {
      status: 409,
      tipo: 'conflicto',
      detail: 'El técnico no es del área de la categoría.',
    };

    expect(interpretarError(error).general).toBe('El técnico no es del área de la categoría.');
  });

  it('[US-08 CA-4] 409 sin tipo pero con detalle muestra el detalle; sin detalle, el microcopy', () => {
    expect(interpretarError({ status: 409, detail: 'Regla incumplida.' }).general).toBe(
      'Regla incumplida.',
    );
    expect(interpretarError({ status: 409 }).general).toBe(TRANSICION);
  });

  it('[US-08 CA-4] 400 con errores conserva el mapa por campo', () => {
    const errores = { idTecnico: 'Requerido', nota: 'Muy larga' };

    const resultado = interpretarError({ status: 400, detail: 'Hay errores.', errores });

    expect(resultado).toEqual({ general: null, campos: errores });
  });

  it('[US-08 CA-4] 400 con campos desconocidos los junta en el mensaje general', () => {
    const resultado = interpretarError(
      { status: 400, errores: { idTecnico: 'Requerido', otro: 'Dato inválido' } },
      ['idTecnico'],
    );

    expect(resultado.general).toBe('Dato inválido');
    expect(resultado.campos.idTecnico).toBe('Requerido');
  });
});
