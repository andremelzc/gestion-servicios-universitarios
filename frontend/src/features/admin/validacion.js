// Validación de los formularios de administración (specs/05-administracion CA-6 y CA-7).
// Cada función devuelve `{ datos }` listo para enviar o `{ errores }` (campo → mensaje).
import { z } from 'zod';

// Campo numérico entero: llega como texto del `<input>` y sale como número.
const entero = (min, vacio, invalido) =>
  z
    .string()
    .trim()
    .min(1, vacio)
    .refine((texto) => /^\d+$/.test(texto) && Number(texto) >= min, invalido)
    .transform(Number);

const prioridadSchema = z.object({
  nivel: z
    .string()
    .trim()
    .min(1, 'Ingresa el nivel de la prioridad.')
    .max(20, 'El nivel admite hasta 20 caracteres.'),
  ponderador: entero(
    1,
    'Ingresa la urgencia como número entero (1 o más).',
    'Ingresa la urgencia como número entero (1 o más).',
  ),
  slaMaxHoras: entero(
    1,
    'Ingresa el SLA en horas.',
    'El SLA debe ser un número entero de horas mayor que 0.',
  ),
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
