import { describe, expect, it } from 'vitest';
import { TITULO_SISTEMA, tituloDeRuta } from './titulos.js';

describe('tituloDeRuta', () => {
  it.each([
    ['/mis-solicitudes', 'Mis solicitudes'],
    ['/solicitudes/nueva', 'Nueva solicitud'],
    ['/solicitudes/42', 'Detalle de solicitud'],
    ['/bandeja', 'Bandeja'],
    ['/dashboard', 'Dashboard'],
    ['/admin/usuarios', 'Usuarios'],
    ['/admin/estados', 'Estados'],
    ['/perfil', 'Perfil'],
  ])('%s → %s', (ruta, titulo) => {
    expect(tituloDeRuta(ruta)).toBe(titulo);
  });

  it('ignora mayúsculas y la barra final, como el router', () => {
    expect(tituloDeRuta('/Admin/Usuarios/')).toBe('Usuarios');
  });

  it('una ruta sin título propio devuelve null (el shell vuelve al nombre del sistema)', () => {
    expect(tituloDeRuta('/ruta-que-no-existe')).toBeNull();
    expect(TITULO_SISTEMA).toContain('GISU');
  });
});
