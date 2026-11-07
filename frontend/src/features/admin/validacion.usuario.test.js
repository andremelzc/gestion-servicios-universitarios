import { describe, expect, it } from 'vitest';
import { validarUsuario } from './validacion.usuario.js';

describe('validarUsuario (api-rest §3.6, RN-21, US-17, US-34)', () => {
  const alta = {
    codigoInstitucional: 'U20260010',
    nombre: ' Lucía ',
    apellido: 'Pérez',
    correo: ' Lucia@Universidad.edu ',
    telefono: '',
    password: 'Segura123',
    rol: 'SUPERVISOR',
    idArea: '1',
  };
  const edicion = { ...alta, password: '' };

  it('[US-34 CA-9] el alta normaliza: recorta, correo en minúsculas, teléfono vacío como null', () => {
    expect(validarUsuario(alta, 'alta')).toEqual({
      datos: {
        codigoInstitucional: 'U20260010',
        nombre: 'Lucía',
        apellido: 'Pérez',
        correo: 'lucia@universidad.edu',
        telefono: null,
        password: 'Segura123',
        rol: 'SUPERVISOR',
        idArea: 1,
      },
    });
  });

  it('[US-17] la edición envía solo nombre, apellido, teléfono, rol y área', () => {
    expect(validarUsuario({ ...edicion, telefono: ' 987654321 ' }, 'edicion')).toEqual({
      datos: {
        nombre: 'Lucía',
        apellido: 'Pérez',
        telefono: '987654321',
        rol: 'SUPERVISOR',
        idArea: 1,
      },
    });
  });

  it.each(['TECNICO', 'SUPERVISOR'])(
    '[US-17 CA-8] %s sin área es un error en idArea (RN-21)',
    (rol) => {
      expect(validarUsuario({ ...edicion, rol, idArea: '' }, 'edicion').errores.idArea).toBe(
        'Selecciona el área: es obligatoria para este rol.',
      );
    },
  );

  it.each(['ESTUDIANTE', 'ADMIN'])(
    '[US-17 CA-8] %s no admite área: se envía idArea null',
    (rol) => {
      expect(validarUsuario({ ...edicion, rol, idArea: '1' }, 'edicion').datos.idArea).toBeNull();
    },
  );

  it('[US-17] exige elegir un rol válido', () => {
    expect(validarUsuario({ ...edicion, rol: '' }, 'edicion').errores.rol).toBe(
      'Selecciona un rol.',
    );
  });

  it('[US-34 CA-9] el correo debe ser institucional y tener formato válido', () => {
    expect(validarUsuario({ ...alta, correo: 'lucia@gmail.com' }, 'alta').errores.correo).toBe(
      'Debe usar correo institucional (@universidad.edu).',
    );
    expect(validarUsuario({ ...alta, correo: 'lucia' }, 'alta').errores.correo).toBe(
      'Debe ser un correo electrónico válido',
    );
  });

  it('[US-34] la contraseña inicial sigue la política solo en el alta', () => {
    expect(validarUsuario({ ...alta, password: 'corta' }, 'alta').errores.password).toBe(
      'Mínimo 8 caracteres, una mayúscula y un número.',
    );
    expect(validarUsuario({ ...alta, password: '' }, 'alta').errores.password).toBe(
      'La contraseña es obligatoria',
    );
    expect(validarUsuario({ ...edicion, password: 'corta' }, 'edicion').datos).toBeDefined();
  });

  it('[US-34] exige código institucional (6 a 20 alfanuméricos), nombre y apellido sin HTML', () => {
    expect(
      validarUsuario({ ...alta, codigoInstitucional: 'a-1' }, 'alta').errores.codigoInstitucional,
    ).toBe('El código institucional debe tener entre 6 y 20 caracteres alfanuméricos');
    expect(validarUsuario({ ...alta, nombre: '' }, 'alta').errores.nombre).toBe(
      'El nombre es obligatorio',
    );
    expect(validarUsuario({ ...alta, apellido: '<b>x</b>' }, 'alta').errores.apellido).toBe(
      'No se permiten etiquetas HTML en este campo.',
    );
  });

  it('[US-34] el teléfono admite hasta 20 caracteres', () => {
    expect(validarUsuario({ ...alta, telefono: '9'.repeat(21) }, 'alta').errores.telefono).toBe(
      'El teléfono admite hasta 20 caracteres.',
    );
  });
});
