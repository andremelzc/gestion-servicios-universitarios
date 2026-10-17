// Validación de los formularios de administración (specs/05-administracion CA-6 y CA-7).
// Cada función devuelve `{ datos }` listo para enviar o `{ errores }` (campo → mensaje).
import { z } from 'zod';

// Campo numérico entero: llega como texto del `<input>` y sale como número.
// Tope: el máximo de un INT de la base (modelo-datos §3.5), para no enviar valores que el
// backend no puede guardar.
const MAX_INT = 2147483647;

const entero = (min, vacio, invalido, excede) =>
  z
    .string()
    .trim()
    .min(1, vacio)
    .refine((texto) => /^\d+$/.test(texto) && Number(texto) >= min, invalido)
    .refine((texto) => !/^\d+$/.test(texto) || Number(texto) <= MAX_INT, excede)
    .transform(Number);

const prioridadSchema = z.object({
  // `nivel` es el código de dominio (BAJA, MEDIA…): se guarda en mayúsculas.
  nivel: z
    .string()
    .trim()
    .min(1, 'Ingresa el nivel de la prioridad.')
    .max(20, 'El nivel admite hasta 20 caracteres.')
    .transform((texto) => texto.toUpperCase()),
  ponderador: entero(
    1,
    'Ingresa la urgencia como número entero (1 o más).',
    'Ingresa la urgencia como número entero (1 o más).',
    `La urgencia no puede superar ${MAX_INT}.`,
  ),
  slaMaxHoras: entero(
    1,
    'Ingresa el SLA en horas.',
    'El SLA debe ser un número entero de horas mayor que 0.',
    `El SLA no puede superar ${MAX_INT} horas.`,
  ),
});

// ADR-009: solo se edita la presentación. Largos de modelo-datos §3.6; color `#RRGGBB` (CHECK).
const estadoSchema = z.object({
  nombreVisible: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre visible.')
    .max(40, 'El nombre visible admite hasta 40 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .max(255, 'La descripción admite hasta 255 caracteres.')
    .transform((texto) => texto || null),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Usa el formato #RRGGBB, por ejemplo #2563EB.')
    .transform((color) => color.toUpperCase()),
});

function resolver(schema, valores) {
  const resultado = schema.safeParse(valores);
  if (resultado.success) return { datos: resultado.data };
  const errores = {};
  for (const { path, message } of resultado.error.issues) errores[path[0]] ??= message;
  return { errores };
}

/** `valores`: `{nivel, ponderador, slaMaxHoras}` como texto (api-rest §3.5: `slaMaxHoras` > 0). */
export const validarPrioridad = (valores) => resolver(prioridadSchema, valores);

/** `valores`: `{nombreVisible, descripcion, colorHex}` como texto; `descripcion` vacía se envía `null`. */
export const validarEstado = (valores) => resolver(estadoSchema, valores);
