// Esquemas Zod del registro de solicitudes (REG-15 · US-05).
// Reglas: spec 02 (US-05, CA-3) y API REST §3.2 — título 5–150, descripción 15–500,
// ubicaciones ≤ 100 y sin HTML en todos los campos de texto.
// Mensajes: UX §9 exactos donde existen; DTO del backend (SolicitudCrearRequest) para el resto.
// Paridad con el backend: @NotBlank (se recorta antes de medir) y SinHtmlValidator (`<[^>]+>`,
// la misma expresión de auth/schemas.js).
import { z } from 'zod';

export const TITULO_MIN = 5;
export const TITULO_MAX = 150;
export const DESCRIPCION_MIN = 15;
export const DESCRIPCION_MAX = 500;
export const UBICACION_MAX = 100;

const MSG_TITULO_REQUERIDO = 'El título es obligatorio';
const MSG_TITULO_LONGITUD = `El título debe tener entre ${TITULO_MIN} y ${TITULO_MAX} caracteres`;
const MSG_DESCRIPCION_REQUERIDA = 'La descripción es obligatoria';
const MSG_DESCRIPCION_LONGITUD = `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres`;
const MSG_CAMPUS_REQUERIDO = 'La ubicación del campus es obligatoria';
const MSG_CAMPUS_LONGITUD = `El campus no puede superar los ${UBICACION_MAX} caracteres`;
const MSG_AMBIENTE_REQUERIDO = 'La ubicación del ambiente es obligatoria';
const MSG_AMBIENTE_LONGITUD = `El ambiente no puede superar los ${UBICACION_MAX} caracteres`;
const MSG_CATEGORIA_REQUERIDA = 'La categoría es obligatoria';
const MSG_PRIORIDAD_REQUERIDA = 'La prioridad es obligatoria';
const MSG_SIN_HTML = 'No se permiten etiquetas HTML en este campo.';

/** Microcopy de UX §9 con la cuenta actual ("…15 caracteres (10/15)."). */
export function mensajeDescripcionCorta(n) {
  return `Describe el problema con al menos ${DESCRIPCION_MIN} caracteres (${n}/${DESCRIPCION_MIN}).`;
}

// Paridad con SinHtmlValidator del backend: `<[^>]+>`.
const REGEX_HTML = /<[^>]+>/;

const tituloSchema = z
  .string({ required_error: MSG_TITULO_REQUERIDO, invalid_type_error: MSG_TITULO_REQUERIDO })
  .trim()
  .min(1, MSG_TITULO_REQUERIDO)
  .min(TITULO_MIN, MSG_TITULO_LONGITUD)
  .max(TITULO_MAX, MSG_TITULO_LONGITUD)
  .refine((valor) => !REGEX_HTML.test(valor), MSG_SIN_HTML);

const descripcionSchema = z
  .string({
    required_error: MSG_DESCRIPCION_REQUERIDA,
    invalid_type_error: MSG_DESCRIPCION_REQUERIDA,
  })
  .trim()
  .min(1, MSG_DESCRIPCION_REQUERIDA)
  .max(DESCRIPCION_MAX, MSG_DESCRIPCION_LONGITUD)
  .refine((valor) => !REGEX_HTML.test(valor), MSG_SIN_HTML)
  .refine(
    (valor) => valor.length >= DESCRIPCION_MIN,
    (valor) => ({ message: mensajeDescripcionCorta(valor.length) }),
  );

const campusSchema = z
  .string({ required_error: MSG_CAMPUS_REQUERIDO, invalid_type_error: MSG_CAMPUS_REQUERIDO })
  .trim()
  .min(1, MSG_CAMPUS_REQUERIDO)
  .max(UBICACION_MAX, MSG_CAMPUS_LONGITUD)
  .refine((valor) => !REGEX_HTML.test(valor), MSG_SIN_HTML);

const ambienteSchema = z
  .string({ required_error: MSG_AMBIENTE_REQUERIDO, invalid_type_error: MSG_AMBIENTE_REQUERIDO })
  .trim()
  .min(1, MSG_AMBIENTE_REQUERIDO)
  .max(UBICACION_MAX, MSG_AMBIENTE_LONGITUD)
  .refine((valor) => !REGEX_HTML.test(valor), MSG_SIN_HTML);

// Los <select> del formulario manejan texto ('' = sin elegir); el contrato envía el id numérico.
const idCatalogoSchema = (requerido) =>
  z
    .string({ required_error: requerido, invalid_type_error: requerido })
    .regex(/^\d+$/, requerido)
    .transform(Number);

export const NuevaSolicitudSchema = z.object({
  titulo: tituloSchema,
  descripcion: descripcionSchema,
  ubicacionCampus: campusSchema,
  ubicacionAmbiente: ambienteSchema,
  idCategoria: idCatalogoSchema(MSG_CATEGORIA_REQUERIDA),
  idPrioridad: idCatalogoSchema(MSG_PRIORIDAD_REQUERIDA),
});
