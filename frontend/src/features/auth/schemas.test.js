import { describe, expect, it } from 'vitest';
import {
  CambiarPasswordSchema,
  LoginSchema,
  RegisterSchema,
  contieneHtml,
  esCorreoInstitucional,
  requisitosPassword,
} from './schemas.js';

const MSG_DOMINIO = 'Debe usar correo institucional (@universidad.edu).';
const MSG_POLITICA = 'Mínimo 8 caracteres, una mayúscula y un número.';
const MSG_SIN_HTML = 'No se permiten etiquetas HTML en este campo.';

const REGISTRO_VALIDO = {
  codigoInstitucional: 'U20261045',
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@universidad.edu',
  password: 'Password123',
};

function mensajes(resultado) {
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('LoginSchema (US-01)', () => {
  it('[CA-1] acepta credenciales válidas', () => {
    expect(LoginSchema.safeParse({ correo: 'juan@universidad.edu', password: 'x' }).success).toBe(
      true,
    );
  });

  it('[RN-02] normaliza mayúsculas y espacios del correo', () => {
    const resultado = LoginSchema.safeParse({
      correo: '  Juan@Universidad.EDU ',
      password: 'x',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.correo).toBe('juan@universidad.edu');
    }
  });

  it('[US-01] el login acepta cualquier formato válido (el dominio lo valida el servidor con 401)', () => {
    expect(LoginSchema.safeParse({ correo: 'juan@gmail.com', password: 'x' }).success).toBe(true);
  });

  it.each([
    ['correo ausente', {}, 'El correo es obligatorio'],
    ['correo vacío', { correo: '', password: 'x' }, 'El correo es obligatorio'],
    [
      'formato inválido',
      { correo: 'juan', password: 'x' },
      'Debe ser un correo electrónico válido',
    ],
    ['password ausente', { correo: 'juan@universidad.edu' }, 'La contraseña es obligatoria'],
    [
      'password vacía',
      { correo: 'juan@universidad.edu', password: '' },
      'La contraseña es obligatoria',
    ],
  ])('[CA-2/CA-5] %s', (_nombre, entrada, mensaje) => {
    expect(mensajes(LoginSchema.safeParse(entrada))).toContain(mensaje);
  });
});

describe('RegisterSchema (US-02/US-03)', () => {
  it('[CA-4] acepta el registro de ejemplo del contrato', () => {
    expect(RegisterSchema.safeParse(REGISTRO_VALIDO).success).toBe(true);
  });

  it.each([
    ['código corto', { codigoInstitucional: 'U12' }],
    ['código largo', { codigoInstitucional: 'U123456789012345678901' }],
    ['código con guion', { codigoInstitucional: 'U-2026!' }],
    ['código ausente', { codigoInstitucional: '' }],
  ])('[API §3.1] %s', (_nombre, parche) => {
    const resultado = RegisterSchema.safeParse({ ...REGISTRO_VALIDO, ...parche });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(
      'El código institucional debe tener entre 6 y 20 caracteres alfanuméricos',
    );
  });

  it.each([
    ['nombre de 1 caracter', { nombre: 'J' }, 'El nombre debe tener entre 2 y 50 caracteres'],
    ['nombre con HTML', { nombre: '<b>Juan</b>' }, MSG_SIN_HTML],
    ['apellido con HTML', { apellido: 'Pérez<script>' }, MSG_SIN_HTML],
  ])('[RN-18] %s', (_nombre, parche, mensaje) => {
    const resultado = RegisterSchema.safeParse({ ...REGISTRO_VALIDO, ...parche });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(mensaje);
  });

  it('[CA-5] rechaza dominio no institucional', () => {
    const resultado = RegisterSchema.safeParse({ ...REGISTRO_VALIDO, correo: 'juan@gmail.com' });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(MSG_DOMINIO);
  });

  it.each([
    ['sin mayúscula ni número', 'password'],
    ['corta', 'Pass1'],
    ['sin número', 'Password'],
    ['sin mayúscula', 'password123'],
  ])('[CA-8] contraseña débil: %s', (_nombre, password) => {
    const resultado = RegisterSchema.safeParse({ ...REGISTRO_VALIDO, password });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(MSG_POLITICA);
  });

  it('[RN-03] acepta Ñ/Á como mayúscula (paridad con Character.isUpperCase del backend)', () => {
    expect(RegisterSchema.safeParse({ ...REGISTRO_VALIDO, password: 'Ñandú1234' }).success).toBe(
      true,
    );
  });

  it('[CA-6/US-03] rechaza el campo "rol"', () => {
    const resultado = RegisterSchema.safeParse({ ...REGISTRO_VALIDO, rol: 'ADMIN' });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => String(i.message).includes('rol'))).toBe(true);
    }
  });
});

describe('CambiarPasswordSchema (US-18)', () => {
  it('[CA-14] acepta actual + nueva válida distinta', () => {
    expect(
      CambiarPasswordSchema.safeParse({ passwordActual: 'OldPass1', nuevaPassword: 'NewPass234' })
        .success,
    ).toBe(true);
  });

  it('[CA-14] exige contraseña actual', () => {
    const resultado = CambiarPasswordSchema.safeParse({
      passwordActual: '',
      nuevaPassword: 'NewPass234',
    });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain('La contraseña actual es obligatoria');
  });

  it('[CA-8] la nueva cumple la política', () => {
    const resultado = CambiarPasswordSchema.safeParse({
      passwordActual: 'OldPass1',
      nuevaPassword: 'password',
    });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(MSG_POLITICA);
  });

  it('[US-18] la nueva debe ser distinta de la actual', () => {
    const resultado = CambiarPasswordSchema.safeParse({
      passwordActual: 'Password123',
      nuevaPassword: 'Password123',
    });

    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain('La nueva contraseña debe ser distinta de la actual.');
  });
});

describe('helpers (AUTH-17 checklist)', () => {
  it.each([
    ['válida', 'Password123', { longitud: true, mayuscula: true, numero: true }],
    ['corta', 'Pass1', { longitud: false, mayuscula: true, numero: true }],
    ['sin mayúscula', 'password123', { longitud: true, mayuscula: false, numero: true }],
    ['sin número', 'Password', { longitud: true, mayuscula: true, numero: false }],
    ['con Ñ como mayúscula', 'Ñandú1234', { longitud: true, mayuscula: true, numero: true }],
    ['no texto', null, { longitud: false, mayuscula: false, numero: false }],
  ])('requisitosPassword(%s)', (_nombre, entrada, esperado) => {
    expect(requisitosPassword(entrada)).toEqual(esperado);
  });

  it.each([
    ['institucional', 'juan@universidad.edu', true],
    ['mayúsculas y espacios', '  Juan@Universidad.EDU ', true],
    ['externo', 'juan@gmail.com', false],
    ['no texto', null, false],
  ])('esCorreoInstitucional(%s)', (_nombre, entrada, esperado) => {
    expect(esCorreoInstitucional(entrada)).toBe(esperado);
  });

  it('contieneHtml detecta etiquetas como el backend', () => {
    expect(contieneHtml('Juan')).toBe(false);
    expect(contieneHtml('<b>Juan</b>')).toBe(true);
    expect(contieneHtml(null)).toBe(false);
  });
});
