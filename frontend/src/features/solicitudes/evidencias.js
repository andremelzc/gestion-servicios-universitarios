// Reglas de las evidencias adjuntas (REG-16 · US-06; CA-4/CA-5 en cliente).
// Paridad con el backend (REG-10): 5 MB por archivo, máx. 3 y JPG/PNG/PDF.
// La firma del contenido la valida el servidor (CA-5); aquí solo extensión/tipo declarado.
// Mensajes exactos de UX §9 (el de máximo de archivos queda pendiente de esa tabla).

/** 5 MB por archivo (5 242 880 bytes, el mismo valor de `spring.servlet.multipart` en REG-10). */
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/** Máximo de evidencias por solicitud (US-06). */
export const MAX_ARCHIVOS = 3;

const EXTENSIONES_PERMITIDAS = /\.(jpe?g|png|pdf)$/i;
const TIPOS_MIME_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export const MSG_ARCHIVO_GRANDE =
  'El archivo excede los 5 MB permitidos. Reduce su tamaño e inténtalo de nuevo.';
export const MSG_TIPO_NO_PERMITIDO = 'Solo se permiten imágenes JPG, PNG o archivos PDF.';
export const MSG_MAXIMO_ARCHIVOS = 'Puedes adjuntar como máximo 3 archivos.';

/** true si el archivo puede mostrarse como miniatura (JPG/PNG). */
export function esImagen(archivo) {
  return ['image/jpeg', 'image/jpg', 'image/png'].includes(archivo.type);
}

/**
 * Mensaje de error del archivo, o `null` si es válido.
 * El tamaño se comprueba primero (CA-4) y luego el tipo (CA-5).
 */
export function validarArchivo(archivo) {
  if (archivo.size > TAMANO_MAXIMO_BYTES) return MSG_ARCHIVO_GRANDE;
  if (!EXTENSIONES_PERMITIDAS.test(archivo.name)) return MSG_TIPO_NO_PERMITIDO;
  if (archivo.type && !TIPOS_MIME_PERMITIDOS.includes(archivo.type)) return MSG_TIPO_NO_PERMITIDO;
  return null;
}

/**
 * Errores de una lista de evidencias. Los formularios (REG-15) deshabilitan el
 * envío mientras esta función devuelva algo (CA-4: "deshabilita el envío").
 */
export function validarArchivos(archivos) {
  return archivos.map(validarArchivo).filter(Boolean);
}

/** Formatea bytes como "1.5 MB" o "320 KB" (vista previa, wireframe W-04). */
export function formatearTamano(bytes) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Number(mb.toFixed(1))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
