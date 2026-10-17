import { describe, expect, it } from 'vitest';
import { ROLES_ADMIN, ROLES_GESTION, rolPuedeAcceder } from './rutasAcceso.js';

describe('rutasAcceso (AUTH-18 · UX §3)', () => {
  it('[AUTH-18] expone los roles de gestión y de administración', () => {
    expect(ROLES_GESTION).toEqual(['TECNICO', 'SUPERVISOR', 'ADMIN']);
    expect(ROLES_ADMIN).toEqual(['ADMIN']);
  });

  it.each([
    ['/mis-solicitudes', 'ESTUDIANTE', true],
    ['/solicitudes/42', 'ESTUDIANTE', true],
    ['/perfil', 'ESTUDIANTE', true],
    ['/bandeja', 'ESTUDIANTE', false],
    ['/bandeja', 'TECNICO', true],
    ['/dashboard', 'ESTUDIANTE', false],
    ['/dashboard', 'SUPERVISOR', true],
    ['/admin', 'TECNICO', false],
    ['/admin/usuarios', 'SUPERVISOR', false],
    ['/admin/usuarios', 'ADMIN', true],
    ['/administracion', 'ESTUDIANTE', true],
    ['/bandeja', undefined, false],
  ])('[AUTH-18] rolPuedeAcceder(%s, %s) = %s', (ruta, rol, esperado) => {
    expect(rolPuedeAcceder(rol, ruta)).toBe(esperado);
  });
});
