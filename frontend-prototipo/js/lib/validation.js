// Reglas de validación puras (sin DOM). Mensajes: ux-ui-prototipo.md §9.
// Reglas: api-rest.md §3.1/3.2 y SRS RN-02, RN-03, RN-15, RN-18.

export const DOMINIO_INSTITUCIONAL = '@universidad.edu';
export const MAX_ARCHIVO_BYTES = 5 * 1024 * 1024;
export const MAX_ARCHIVOS = 3;
export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];
export const DESCRIPCION_MIN = 15;
export const DESCRIPCION_MAX = 500;

export const MENSAJES = {
  correoRequerido: 'Ingresa tu correo institucional.',
  correoInvalido: 'Ingresa un correo válido.',
  correoNoInstitucional: 'Debe usar correo institucional (@universidad.edu).',
  passwordRequerida: 'Ingresa tu contraseña.',
  passwordDebil: 'Mínimo 8 caracteres, una mayúscula y un número.',
  sinHtml: 'No se permiten etiquetas HTML en este campo.',
  archivoGrande: 'El archivo excede los 5 MB permitidos. Reduce su tamaño e inténtalo de nuevo.',
  archivoTipo: 'Solo se permiten imágenes JPG, PNG o archivos PDF.',
  maxArchivos: 'Puedes adjuntar hasta 3 archivos.',
  seleccionaOpcion: 'Selecciona una opción.',
};

const RE_HTML = /<\/?[a-zA-Z!][^>]*>/;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_CODIGO = /^[A-Za-z0-9]{6,20}$/;

export const contieneHtml = (texto) => RE_HTML.test(String(texto ?? ''));

export function validarCorreo(valor, { institucional = false } = {}) {
  const correo = String(valor ?? '').trim();
  if (!correo) return MENSAJES.correoRequerido;
  if (!RE_CORREO.test(correo)) return MENSAJES.correoInvalido;
  if (institucional && !correo.toLowerCase().endsWith(DOMINIO_INSTITUCIONAL)) {
    return MENSAJES.correoNoInstitucional;
  }
  return null;
}

export function evaluarPassword(password, correo = '') {
  const valor = String(password ?? '');
  const reglas = {
    longitud: valor.length >= 8,
    mayuscula: /[A-Z]/.test(valor),
    numero: /\d/.test(valor),
  };
  const igualCorreo = valor !== '' && valor.toLowerCase() === String(correo).trim().toLowerCase();
  return { reglas, igualCorreo, ok: reglas.longitud && reglas.mayuscula && reglas.numero && !igualCorreo };
}

export function validarPassword(password, correo = '') {
  if (!String(password ?? '')) return MENSAJES.passwordRequerida;
  return evaluarPassword(password, correo).ok ? null : MENSAJES.passwordDebil;
}

export function validarTitulo(valor) {
  const t = String(valor ?? '').trim();
  if (t.length < 5) return 'El título debe tener al menos 5 caracteres.';
  if (t.length > 150) return 'El título no puede superar los 150 caracteres.';
  if (contieneHtml(t)) return MENSAJES.sinHtml;
  return null;
}

export function validarDescripcion(valor) {
  const d = String(valor ?? '').trim();
  if (d.length < DESCRIPCION_MIN) {
    return `Describe el problema con al menos ${DESCRIPCION_MIN} caracteres (${d.length}/${DESCRIPCION_MIN}).`;
  }
  if (d.length > DESCRIPCION_MAX) return `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres.`;
  if (contieneHtml(d)) return MENSAJES.sinHtml;
  return null;
}

export function validarTextoCorto(valor, etiqueta, max = 100) {
  const t = String(valor ?? '').trim();
  if (!t) return `${etiqueta}: este campo es obligatorio.`;
  if (t.length > max) return `${etiqueta} no puede superar los ${max} caracteres.`;
  if (contieneHtml(t)) return MENSAJES.sinHtml;
  return null;
}

export function validarArchivo({ size, type }) {
  if (!TIPOS_PERMITIDOS.includes(type)) return MENSAJES.archivoTipo;
  if (size > MAX_ARCHIVO_BYTES) return MENSAJES.archivoGrande;
  return null;
}

export function validarArchivos(archivos, { yaAdjuntos = 0 } = {}) {
  const validos = [];
  const errores = [];
  for (const archivo of archivos) {
    const mensaje = validarArchivo(archivo);
    if (mensaje) {
      errores.push({ nombre: archivo.name, mensaje });
    } else if (yaAdjuntos + validos.length >= MAX_ARCHIVOS) {
      errores.push({ nombre: archivo.name, mensaje: MENSAJES.maxArchivos });
    } else {
      validos.push(archivo);
    }
  }
  return { validos, errores };
}

function validarNombre(valor, etiqueta) {
  const t = String(valor ?? '').trim();
  if (t.length < 2 || t.length > 50) return `${etiqueta}: entre 2 y 50 caracteres.`;
  if (contieneHtml(t)) return MENSAJES.sinHtml;
  return null;
}

export function validarRegistro({ codigoInstitucional, nombre, apellido, correo, password }) {
  const candidatos = {
    codigoInstitucional: RE_CODIGO.test(String(codigoInstitucional ?? ''))
      ? null
      : 'El código debe tener entre 6 y 20 letras o números.',
    nombre: validarNombre(nombre, 'Nombres'),
    apellido: validarNombre(apellido, 'Apellidos'),
    correo: validarCorreo(correo, { institucional: true }),
    password: validarPassword(password, correo),
  };
  return Object.fromEntries(Object.entries(candidatos).filter(([, mensaje]) => mensaje));
}

export const contarCaracteres = (texto) => String(texto ?? '').trim().length;

export const formatearContador = (actual, max) => `${actual} / ${max}`;
