// Validación de los formularios de categorías y áreas (US-15, US-16). Vive aparte de
// `validacion.js` para no mezclar el trabajo de pantallas distintas; mismo contrato: cada función
// devuelve `{ datos }` listo para enviar o `{ errores }` (campo → mensaje).
import { z } from 'zod';

// Tope de un INT de la base (modelo-datos §3.4): evita enviar valores que no se pueden guardar.
const MAX_INT = 2147483647;
const MSG_SLA = 'Ingresa el SLA como número entero de horas (1 o más).';

const textoObligatorio = (vacio, max, excede) => z.string().trim().min(1, vacio).max(max, excede);

const enteroPositivo = (vacio, invalido, excede) =>
  z
    .string()
    .trim()
    .min(1, vacio)
    .refine((texto) => /^\d+$/.test(texto) && Number(texto) >= 1, invalido)
    .refine((texto) => !/^\d+$/.test(texto) || Number(texto) <= MAX_INT, excede)
    .transform(Number);

// Largos de modelo-datos §3.2 y §3.4.
const categoriaSchema = z.object({
  nombre: textoObligatorio(
    'Ingresa el nombre de la categoría.',
    80,
    'El nombre admite hasta 80 caracteres.',
  ),
  descripcion: z
    .string()
    .trim()
    .max(255, 'La descripción admite hasta 255 caracteres.')
    .transform((texto) => texto || null),
  idArea: enteroPositivo(
    'Selecciona el área responsable.',
    'Selecciona el área responsable.',
    'Selecciona el área responsable.',
  ),
  tiempoSlaHoras: enteroPositivo(
    'Ingresa el SLA en horas.',
    MSG_SLA,
    `El SLA no puede superar ${MAX_INT} horas.`,
  ),
});

const areaSchema = z.object({
  nombre: textoObligatorio(
    'Ingresa el nombre del área.',
    100,
    'El nombre admite hasta 100 caracteres.',
  ),
  correoContacto: z
    .string()
    .trim()
    .min(1, 'Ingresa el correo de contacto.')
    .max(100, 'El correo admite hasta 100 caracteres.')
    .pipe(z.email('Ingresa un correo válido.')),
});

function resolver(schema, valores) {
  const resultado = schema.safeParse(valores);
  if (resultado.success) return { datos: resultado.data };
  const errores = {};
  for (const { path, message } of resultado.error.issues) errores[path[0]] ??= message;
  return { errores };
}

/** `valores`: `{nombre, descripcion, idArea, tiempoSlaHoras}` como texto; descripción vacía → `null`. */
export const validarCategoria = (valores) => resolver(categoriaSchema, valores);

/** `valores`: `{nombre, correoContacto}` como texto. */
export const validarArea = (valores) => resolver(areaSchema, valores);
