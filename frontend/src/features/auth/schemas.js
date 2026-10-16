// Esquemas Zod de autenticación (AUTH-04 · US-01/02/03/18).
// Reglas: API REST §3.1, RN-02/RN-03/RN-04/RN-18, UX §9 (mensajes exactos).
// Paridad backend: RegistroRequest/LoginRequest, PasswordSeguraValidator,
// DominioInstitucionalValidator, SinHtmlValidator (ver docs y backend en develop).
import { z } from 'zod';

// Dominio institucional por defecto (backend: app.security.allowed-email-domain).
// Si cambia en el backend, actualizar aquí y en MSG_DOMINIO.
export const DOMINIO_INSTITUCIONAL = 'universidad.edu';

// Mensajes: UX §9 exactos donde existen; DTO backend donde UX no define.
const MSG_CORREO_REQUERIDO = 'El correo es obligatorio';
const MSG_CORREO_FORMATO = 'Debe ser un correo electrónico válido';
const MSG_DOMINIO = `Debe usar correo institucional (@${DOMINIO_INSTITUCIONAL}).`;
const MSG_PASSWORD_REQUERIDA = 'La contraseña es obligatoria';
const MSG_PASSWORD_ACTUAL_REQUERIDA = 'La contraseña actual es obligatoria';
const MSG_PASSWORD_POLITICA = 'Mínimo 8 caracteres, una mayúscula y un número.';
const MSG_SIN_HTML = 'No se permiten etiquetas HTML en este campo.';
const MSG_NUEVA_DISTINTA = 'La nueva contraseña debe ser distinta de la actual.';
const MSG_CODIGO_REQUERIDO = 'El código institucional es obligatorio';
const MSG_CODIGO_FORMATO =
  'El código institucional debe tener entre 6 y 20 caracteres alfanuméricos';
const MSG_NOMBRE_REQUERIDO = 'El nombre es obligatorio';
const MSG_NOMBRE_LONGITUD = 'El nombre debe tener entre 2 y 50 caracteres';
const MSG_APELLIDO_REQUERIDO = 'El apellido es obligatorio';
const MSG_APELLIDO_LONGITUD = 'El apellido debe tener entre 2 y 50 caracteres';

const REGEX_CODIGO = /^[A-Za-z0-9]{6,20}$/;
const REGEX_MAYUSCULA = /[A-Z]/;
const REGEX_NUMERO = /[0-9]/;
// Paridad con SinHtmlValidator: <[^>]+>
const REGEX_HTML = /<[^>]+>/;

// Deferir al mensaje de formato cuando no hay @ (igual que el backend).
export function esCorreoInstitucional(correo) {
  if (typeof correo !== 'string') return false;
  const normalizado = correo.trim().toLowerCase();
  const arroba = normalizado.lastIndexOf('@');
  if (arroba < 0) return true;
  return normalizado.slice(arroba + 1) === DOMINIO_INSTITUCIONAL.toLowerCase();
}

export function contieneHtml(texto) {
  return typeof texto === 'string' && REGEX_HTML.test(texto);
}

// Checklist en vivo para AUTH-17 (sin recortar: la política cuenta tal cual se escribe).
export function requisitosPassword(password) {
  if (typeof password !== 'string') {
    return { longitud: false, mayuscula: false, numero: false };
  }
  return {
    longitud: password.length >= 8,
    mayuscula: REGEX_MAYUSCULA.test(password),
    numero: REGEX_NUMERO.test(password),
  };
}

const correoSchema = z
  .string({
    required_error: MSG_CORREO_REQUERIDO,
    invalid_type_error: MSG_CORREO_REQUERIDO,
  })
  .trim()
  .toLowerCase()
  .min(1, MSG_CORREO_REQUERIDO)
  .email(MSG_CORREO_FORMATO)
  .refine(esCorreoInstitucional, MSG_DOMINIO);

// Sin trim: la contraseña se usa tal cual (el backend no la recorta).
// Sin .strict(): el backend solo rechaza campos extra en /registro (CA-6).
const passwordLoginSchema = z
  .string({
    required_error: MSG_PASSWORD_REQUERIDA,
    invalid_type_error: MSG_PASSWORD_REQUERIDA,
  })
  .min(1, MSG_PASSWORD_REQUERIDA);

const passwordPoliticaSchema = z
  .string({
    required_error: MSG_PASSWORD_REQUERIDA,
    invalid_type_error: MSG_PASSWORD_REQUERIDA,
  })
  .min(1, MSG_PASSWORD_REQUERIDA)
  .min(8, MSG_PASSWORD_POLITICA)
  .regex(REGEX_MAYUSCULA, MSG_PASSWORD_POLITICA)
  .regex(REGEX_NUMERO, MSG_PASSWORD_POLITICA);

const nombreSchema = z
  .string({
    required_error: MSG_NOMBRE_REQUERIDO,
    invalid_type_error: MSG_NOMBRE_REQUERIDO,
  })
  .trim()
  .min(1, MSG_NOMBRE_REQUERIDO)
  .min(2, MSG_NOMBRE_LONGITUD)
  .max(50, MSG_NOMBRE_LONGITUD)
  .refine((v) => !contieneHtml(v), MSG_SIN_HTML);

const apellidoSchema = z
  .string({
    required_error: MSG_APELLIDO_REQUERIDO,
    invalid_type_error: MSG_APELLIDO_REQUERIDO,
  })
  .trim()
  .min(1, MSG_APELLIDO_REQUERIDO)
  .min(2, MSG_APELLIDO_LONGITUD)
  .max(50, MSG_APELLIDO_LONGITUD)
  .refine((v) => !contieneHtml(v), MSG_SIN_HTML);

export const LoginSchema = z.object({
  correo: correoSchema,
  password: passwordLoginSchema,
});

// .strict(): el registro no admite "rol" (RN-04/CA-6; backend responde 400).
export const RegisterSchema = z
  .object({
    codigoInstitucional: z
      .string({
        required_error: MSG_CODIGO_REQUERIDO,
        invalid_type_error: MSG_CODIGO_REQUERIDO,
      })
      .trim()
      .min(1, MSG_CODIGO_REQUERIDO)
      .regex(REGEX_CODIGO, MSG_CODIGO_FORMATO),
    nombre: nombreSchema,
    apellido: apellidoSchema,
    correo: correoSchema,
    password: passwordPoliticaSchema,
  })
  .strict();

// .strict(): el contrato solo admite estos 2 campos (API §3.1);
// "confirmar" vive solo en la UI y se excluye antes de validar/enviar.
export const CambiarPasswordSchema = z
  .object({
    passwordActual: z
      .string({
        required_error: MSG_PASSWORD_ACTUAL_REQUERIDA,
        invalid_type_error: MSG_PASSWORD_ACTUAL_REQUERIDA,
      })
      .min(1, MSG_PASSWORD_ACTUAL_REQUERIDA),
    nuevaPassword: passwordPoliticaSchema,
  })
  .strict()
  // US-18/CA-14: la nueva debe ser distinta de la actual.
  .refine((v) => v.nuevaPassword !== v.passwordActual, {
    message: MSG_NUEVA_DISTINTA,
    path: ['nuevaPassword'],
  });
