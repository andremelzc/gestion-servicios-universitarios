import { describe, expect, it } from 'vitest';
import { NuevaSolicitudSchema, mensajeDescripcionCorta } from './schemas.js';

const VALIDA = {
  titulo: 'Proyector sin imagen',
  descripcion: 'El proyector del aula B-402 enciende pero no muestra imagen por HDMI.',
  ubicacionCampus: 'Campus Central',
  ubicacionAmbiente: 'Pabellón B - Aula 402',
  idCategoria: '2',
  idPrioridad: '3',
};

function parsear(overrides = {}) {
  return NuevaSolicitudSchema.safeParse({ ...VALIDA, ...overrides });
}

const primerError = (resultado, campo) =>
  resultado.error.issues.find((issue) => issue.path[0] === campo)?.message;

describe('NuevaSolicitudSchema (REG-15 · US-05)', () => {
  it('acepta una solicitud válida: recorta espacios y convierte los ids del select a número', () => {
    const resultado = parsear({ titulo: '  Proyector sin imagen  ' });

    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual({
      ...VALIDA,
      titulo: 'Proyector sin imagen',
      idCategoria: 2,
      idPrioridad: 3,
    });
  });

  it('exige los seis campos del contrato cuando llegan vacíos o ausentes', () => {
    const resultado = NuevaSolicitudSchema.safeParse({});

    expect(resultado.success).toBe(false);
    expect(primerError(resultado, 'titulo')).toBe('El título es obligatorio');
    expect(primerError(resultado, 'descripcion')).toBe('La descripción es obligatoria');
    expect(primerError(resultado, 'ubicacionCampus')).toBe(
      'La ubicación del campus es obligatoria',
    );
    expect(primerError(resultado, 'ubicacionAmbiente')).toBe(
      'La ubicación del ambiente es obligatoria',
    );
    expect(primerError(resultado, 'idCategoria')).toBe('La categoría es obligatoria');
    expect(primerError(resultado, 'idPrioridad')).toBe('La prioridad es obligatoria');
  });

  it('valida el título entre 5 y 150 caracteres (paridad con @Size del backend)', () => {
    expect(primerError(parsear({ titulo: 'abre' }), 'titulo')).toBe(
      'El título debe tener entre 5 y 150 caracteres',
    );
    expect(primerError(parsear({ titulo: 'a'.repeat(151) }), 'titulo')).toBe(
      'El título debe tener entre 5 y 150 caracteres',
    );
    expect(parsear({ titulo: '12345' }).success).toBe(true);
  });

  it('valida la descripción 15–500 con el microcopy de UX §9 y la cuenta actual', () => {
    expect(primerError(parsear({ descripcion: 'x'.repeat(14) }), 'descripcion')).toBe(
      mensajeDescripcionCorta(14),
    );
    expect(parsear({ descripcion: 'x'.repeat(15) }).success).toBe(true);
    expect(primerError(parsear({ descripcion: 'x'.repeat(501) }), 'descripcion')).toBe(
      'La descripción no puede superar los 500 caracteres',
    );
  });

  it('limita las ubicaciones a 100 caracteres (paridad con @Size del backend)', () => {
    expect(primerError(parsear({ ubicacionCampus: 'x'.repeat(101) }), 'ubicacionCampus')).toBe(
      'El campus no puede superar los 100 caracteres',
    );
    expect(primerError(parsear({ ubicacionAmbiente: 'x'.repeat(101) }), 'ubicacionAmbiente')).toBe(
      'El ambiente no puede superar los 100 caracteres',
    );
  });

  it('rechaza etiquetas HTML en los cuatro campos de texto (RN-18)', () => {
    const html = '<b>ejemplo</b>';
    for (const campo of ['titulo', 'descripcion', 'ubicacionCampus', 'ubicacionAmbiente']) {
      const resultado = parsear({ [campo]: `Texto ${html} suficientemente largo` });
      expect(primerError(resultado, campo)).toBe('No se permiten etiquetas HTML en este campo.');
    }
  });

  it('rechaza selecciones sin elegir o no numéricas de los catálogos', () => {
    expect(primerError(parsear({ idCategoria: '' }), 'idCategoria')).toBe(
      'La categoría es obligatoria',
    );
    expect(primerError(parsear({ idPrioridad: 'alta' }), 'idPrioridad')).toBe(
      'La prioridad es obligatoria',
    );
  });
});
