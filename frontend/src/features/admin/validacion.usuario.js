// Validación del formulario de usuarios (specs/05-administracion CA-8 y CA-9, api-rest §3.6).
// Devuelve `{ datos }` listo para enviar o `{ errores }` (campo → mensaje), como `validacion.js`.
// Las reglas de correo, nombre y contraseña siguen las del registro (`auth/schemas.js`), que
// replican las del backend; los mensajes son los mismos.
import { z } from 'zod';
import {
  DOMINIO_INSTITUCIONAL,
  contieneHtml,
  esCorreoInstitucional,
  requisitosPassword,
} from '../auth/schemas.js';
import { ROLES, ROLES_CON_AREA } from './roles.js';

const MSG_SIN_HTML = 'No se permiten etiquetas HTML en este campo.';
const MSG_PASSWORD_POLITICA = 'Mínimo 8 caracteres, una mayúscula y un número.';

const texto = (campo) =>
  z
    .string()
    .trim()
    .min(1, `El ${campo} es obligatorio`)
    .min(2, `El ${campo} debe tener entre 2 y 50 caracteres`)
    .max(50, `El ${campo} debe tener entre 2 y 50 caracteres`)
    .refine((v) => !contieneHtml(v), MSG_SIN_HTML);

const base = {
  nombre: texto('nombre'),
  apellido: texto('apellido'),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono admite hasta 20 caracteres.')
    .transform((valor) => valor || null),
  rol: z.enum(
    ROLES.map((r) => r.codigo),
    { error: 'Selecciona un rol.' },
  ),
  idArea: z.string(),
};

const altaExtra = {
  codigoInstitucional: z
    .string()
    .trim()
    .min(1, 'El código institucional es obligatorio')
    .regex(
      /^[A-Za-z0-9]{6,20}$/,
      'El código institucional debe tener entre 6 y 20 caracteres alfanuméricos',
    ),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'El correo es obligatorio')
    .email('Debe ser un correo electrónico válido')
    .refine(esCorreoInstitucional, `Debe usar correo institucional (@${DOMINIO_INSTITUCIONAL}).`),
  // Sin recortar: la política cuenta la contraseña tal cual se escribe.
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .refine(
      (valor) => Object.values(requisitosPassword(valor)).every(Boolean),
      MSG_PASSWORD_POLITICA,
    ),
};

// RN-21: TECNICO y SUPERVISOR exigen área; ESTUDIANTE y ADMIN no la admiten (se envía `null`).
function resolverArea(datos, contexto) {
  if (!ROLES_CON_AREA.includes(datos.rol)) return { ...datos, idArea: null };
  const idArea = Number(datos.idArea);
  if (!datos.idArea || !Number.isInteger(idArea) || idArea < 1) {
    contexto.addIssue({
      code: 'custom',
      path: ['idArea'],
      message: 'Selecciona el área: es obligatoria para este rol.',
    });
    return z.NEVER;
  }
  return { ...datos, idArea };
}

const esquemas = {
  alta: z.object({ ...altaExtra, ...base }).transform(resolverArea),
  edicion: z.object(base).transform(resolverArea),
};

/**
 * `valores`: todos los campos del formulario como texto. `modo` 'alta' valida y envía además
 * código, correo y contraseña inicial; 'edicion' solo nombre, apellido, teléfono, rol y área
 * (api-rest §3.6: el PUT no cambia correo ni contraseña).
 */
export function validarUsuario(valores, modo) {
  const resultado = esquemas[modo].safeParse(valores);
  if (resultado.success) return { datos: resultado.data };
  const errores = {};
  for (const { path, message } of resultado.error.issues) errores[path[0]] ??= message;
  return { errores };
}
