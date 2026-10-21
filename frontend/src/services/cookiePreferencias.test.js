// @vitest-environment-options {"url": "https://localhost:3000"}
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_AGE_SEGUNDOS,
  NOMBRE_COOKIE,
  PREFERENCIAS_POR_DEFECTO,
  actualizarPreferencias,
  borrarPreferencias,
  construirCookie,
  escribirPreferencias,
  leerPreferencias,
  validarPreferencias,
} from './cookiePreferencias.js';

// Escribe una cookie cruda (como la dejaría otro código o un usuario manipulándola).
const ponerCruda = (valor) => {
  document.cookie = `${NOMBRE_COOKIE}=${valor}; Path=/; Secure`;
};
const codificar = (obj) => encodeURIComponent(JSON.stringify(obj));

afterEach(() => {
  vi.restoreAllMocks();
  borrarPreferencias();
});

describe('construirCookie (ADR-004)', () => {
  it('usa Path=/, Max-Age de 1 año, SameSite=Lax y Secure siempre', () => {
    const cookie = construirCookie({ tema: 'oscuro', menuColapsado: true });
    expect(MAX_AGE_SEGUNDOS).toBe(31536000);
    expect(cookie).toContain(`${NOMBRE_COOKIE}=`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=31536000');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
  });

  it('añade Secure aunque se pida lo contrario (ADR-004, sin excepciones)', () => {
    expect(construirCookie(PREFERENCIAS_POR_DEFECTO, { seguro: false })).toContain('; Secure');
  });

  it('codifica el JSON y solo incluye tema y menuColapsado', () => {
    const cookie = construirCookie({
      tema: 'claro',
      menuColapsado: false,
      token: 'abc',
      correo: 'a@b.c',
    });
    const valor = decodeURIComponent(cookie.split(';')[0].split('=').slice(1).join('='));
    expect(JSON.parse(valor)).toEqual({ tema: 'claro', menuColapsado: false });
    expect(cookie).not.toContain('abc');
    expect(cookie).not.toContain('a%40b.c');
  });
});

describe('validarPreferencias', () => {
  it('acepta valores válidos', () => {
    expect(validarPreferencias({ tema: 'oscuro', menuColapsado: true })).toEqual({
      tema: 'oscuro',
      menuColapsado: true,
    });
  });

  it('descarta campos inválidos y cae al valor por defecto', () => {
    expect(validarPreferencias({ tema: 'rosa', menuColapsado: 'si' })).toEqual(
      PREFERENCIAS_POR_DEFECTO,
    );
  });

  it('conserva el campo válido aunque el otro no lo sea', () => {
    expect(validarPreferencias({ tema: 'rosa', menuColapsado: true })).toEqual({
      tema: null,
      menuColapsado: true,
    });
  });

  it.each([null, undefined, 'texto', 42, [], true])('tolera una entrada no objeto: %s', (v) => {
    expect(validarPreferencias(v)).toEqual(PREFERENCIAS_POR_DEFECTO);
  });
});

describe('leerPreferencias / escribirPreferencias', () => {
  it('sin cookie devuelve los valores por defecto (tema null = seguir al sistema)', () => {
    expect(leerPreferencias()).toEqual({ tema: null, menuColapsado: false });
  });

  it('escribe y vuelve a leer las preferencias', () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    expect(leerPreferencias()).toEqual({ tema: 'oscuro', menuColapsado: true });
  });

  it('no mezcla otras cookies con gu_prefs', () => {
    document.cookie = 'otra=1; Path=/';
    escribirPreferencias({ tema: 'claro', menuColapsado: false });
    expect(leerPreferencias()).toEqual({ tema: 'claro', menuColapsado: false });
    document.cookie = 'otra=; Path=/; Max-Age=0';
  });

  it('no confunde una cookie de nombre parecido (xgu_prefs) con gu_prefs', () => {
    document.cookie = `x${NOMBRE_COOKIE}=${codificar({ tema: 'oscuro', menuColapsado: true })}; Path=/`;
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
    document.cookie = `x${NOMBRE_COOKIE}=; Path=/; Max-Age=0`;
  });

  it('con gu_prefs duplicada toma la última que valida', () => {
    const buena = codificar({ tema: 'claro', menuColapsado: true });
    const otra = codificar({ tema: 'oscuro', menuColapsado: false });
    const roto = 'no-es-json';
    const leer = vi.spyOn(document, 'cookie', 'get');
    leer.mockReturnValue(`${NOMBRE_COOKIE}=${otra}; ${NOMBRE_COOKIE}=${buena}`);
    expect(leerPreferencias()).toEqual({ tema: 'claro', menuColapsado: true });
    leer.mockReturnValue(`${NOMBRE_COOKIE}=${buena}; ${NOMBRE_COOKIE}=${roto}`);
    expect(leerPreferencias()).toEqual({ tema: 'claro', menuColapsado: true });
    leer.mockReturnValue(`${NOMBRE_COOKIE}=${roto}; ${NOMBRE_COOKIE}=%E0%A4%A`);
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it.each([
    ['no es JSON', 'esto-no-es-json'],
    ['URI mal codificada', '%E0%A4%A'],
    ['JSON truncado', encodeURIComponent('{"tema":"osc')],
    ['JSON de otro tipo', encodeURIComponent('[1,2,3]')],
    ['cadena vacía', ''],
  ])('tolera una cookie corrupta (%s) sin lanzar', (_nombre, crudo) => {
    ponerCruda(crudo);
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('borrarPreferencias elimina la cookie (con los mismos atributos, incl. Secure)', () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    const escribir = vi.spyOn(document, 'cookie', 'set');
    borrarPreferencias();
    expect(escribir).toHaveBeenCalledWith(expect.stringContaining('Secure'));
    expect(escribir).toHaveBeenCalledWith(expect.stringContaining('Max-Age=0'));
    expect(document.cookie).not.toContain(NOMBRE_COOKIE);
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('no escribe token ni datos personales en la cookie', () => {
    localStorage.setItem('gestion_univ_auth', JSON.stringify({ token: 'jwt-secreto' }));
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    expect(document.cookie).not.toContain('jwt-secreto');
    const par = document.cookie.split('; ').find((p) => p.startsWith(`${NOMBRE_COOKIE}=`));
    const guardado = JSON.parse(decodeURIComponent(par.slice(NOMBRE_COOKIE.length + 1)));
    expect(Object.keys(guardado)).toEqual(['tema', 'menuColapsado']);
    localStorage.clear();
  });
});

describe('actualizarPreferencias (varias pestañas)', () => {
  it('relee la cookie y fusiona solo la clave cambiada', () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: false });
    // Otra pestaña cambia el menú mientras esta conserva un estado viejo en memoria.
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    const resultado = actualizarPreferencias({ tema: 'claro' });
    expect(resultado).toEqual({ tema: 'claro', menuColapsado: true });
    expect(leerPreferencias()).toEqual({ tema: 'claro', menuColapsado: true });
  });

  it('ignora claves ajenas y valores inválidos del cambio', () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    expect(actualizarPreferencias({ tema: 'rosa', token: 'x' })).toEqual({
      tema: null,
      menuColapsado: true,
    });
  });
});
