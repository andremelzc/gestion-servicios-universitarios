// Lógica pura de la API simulada. server.js solo la cablea a json-server.
// Contratos: docs/02-diseno/api-rest.md (RFC 7807, login, registro, POST /solicitudes).
import { randomBytes } from 'node:crypto';
import {
  validarCorreo,
  validarRegistro,
  validarTitulo,
  validarDescripcion,
  validarTextoCorto,
  MAX_ARCHIVOS,
} from '../js/lib/validation.js';

const BASE_TIPOS = 'https://servicios.universidad.edu/problemas';
const TOKEN_PREFIJO = 'mock.';

export function problema(status, tipo, titulo, detail, instance, errores) {
  return {
    type: `${BASE_TIPOS}/${tipo}`,
    title: titulo,
    status,
    detail,
    ...(errores ? { errores } : {}),
    instance,
    timestamp: new Date().toISOString(),
    traceId: randomBytes(16).toString('hex'),
  };
}

const sinPassword = ({ password, alias, ...resumen }) => resumen;

function respuestaAuth(usuario) {
  return {
    token: `${TOKEN_PREFIJO}${usuario.id}`,
    tipo: 'Bearer',
    expiraEn: 28800,
    usuario: sinPassword(usuario),
  };
}

export function login(usuarios, cuerpo, instance = '/api/v1/auth/login') {
  const errores = {};
  const errCorreo = validarCorreo(cuerpo?.correo);
  if (errCorreo) errores.correo = errCorreo;
  if (!cuerpo?.password) errores.password = 'La contraseña es obligatoria.';
  if (Object.keys(errores).length) {
    return { status: 400, body: problema(400, 'validacion', 'Solicitud inválida', 'Hay campos inválidos.', instance, errores) };
  }
  const usuario = usuarios.find((u) => u.correo === String(cuerpo.correo).trim().toLowerCase());
  if (!usuario || usuario.password !== cuerpo.password) {
    return { status: 401, body: problema(401, 'no-autenticado', 'No autenticado', 'Credenciales inválidas', instance) };
  }
  return { status: 200, body: respuestaAuth(usuario) };
}

export function registro(usuarios, cuerpo, instance = '/api/v1/auth/registro') {
  if (cuerpo && 'rol' in cuerpo) {
    return { status: 400, body: problema(400, 'validacion', 'Solicitud inválida', 'El campo "rol" no está permitido.', instance, { rol: 'No se admite este campo.' }) };
  }
  const errores = validarRegistro(cuerpo ?? {});
  if (Object.keys(errores).length) {
    return { status: 400, body: problema(400, 'validacion', 'Solicitud inválida', 'Hay campos inválidos.', instance, errores) };
  }
  const correo = cuerpo.correo.trim().toLowerCase();
  if (usuarios.some((u) => u.correo === correo)) {
    return { status: 409, body: problema(409, 'correo-duplicado', 'Conflicto', 'Ya existe una cuenta con ese correo.', instance) };
  }
  const nuevo = {
    id: Math.max(0, ...usuarios.map((u) => u.id)) + 1,
    nombre: cuerpo.nombre.trim(),
    apellido: cuerpo.apellido.trim(),
    correo,
    rol: 'ESTUDIANTE',
    idArea: null,
    password: cuerpo.password,
  };
  usuarios.push(nuevo);
  return { status: 201, body: respuestaAuth(nuevo) };
}

export function usuarioDeAutorizacion(usuarios, cabecera) {
  const m = /^Bearer mock\.(\d+)$/.exec(cabecera ?? '');
  return m ? (usuarios.find((u) => u.id === Number(m[1])) ?? null) : null;
}

export const esMultipart = (contentType) => /^multipart\/form-data;/i.test(contentType ?? '');

// Parser multipart mínimo, suficiente para el FormData de la maqueta.
export function parseMultipart(buffer, contentType) {
  const m = /^multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  if (!m) return [];
  const delimitador = Buffer.from(`--${m[1] ?? m[2]}`);
  const partes = [];
  let pos = buffer.indexOf(delimitador);
  while (pos !== -1) {
    const inicio = pos + delimitador.length;
    if (buffer.subarray(inicio, inicio + 2).toString() === '--') break;
    const siguiente = buffer.indexOf(delimitador, inicio);
    if (siguiente === -1) break;
    const bloque = buffer.subarray(inicio + 2, siguiente - 2); // quita CRLF inicial y final
    const corte = bloque.indexOf('\r\n\r\n');
    const cabeceras = bloque.subarray(0, corte).toString();
    partes.push({
      name: /name="([^"]*)"/.exec(cabeceras)?.[1] ?? '',
      filename: /filename="([^"]*)"/.exec(cabeceras)?.[1] ?? null,
      contentType: /Content-Type:\s*([^\r\n]+)/i.exec(cabeceras)?.[1] ?? null,
      data: bloque.subarray(corte + 4),
    });
    pos = siguiente;
  }
  return partes;
}

const sumarHoras = (fecha, horas) => new Date(fecha.getTime() + horas * 3600 * 1000).toISOString();
const activo = (x) => x && x.activo !== false;

export function crearSolicitud(ctx, usuario, datos, numArchivos, instance = '/api/v1/solicitudes') {
  const errores = {};
  const set = (campo, msg) => msg && (errores[campo] = msg);
  set('titulo', validarTitulo(datos?.titulo));
  set('descripcion', validarDescripcion(datos?.descripcion));
  set('ubicacionCampus', validarTextoCorto(datos?.ubicacionCampus, 'Campus'));
  set('ubicacionAmbiente', validarTextoCorto(datos?.ubicacionAmbiente, 'Ubicación'));
  const categoria = ctx.categorias.find((c) => c.id === datos?.idCategoria);
  const prioridad = ctx.prioridades.find((p) => p.id === datos?.idPrioridad);
  if (!activo(categoria)) errores.idCategoria = 'Selecciona una categoría existente y activa.';
  if (!activo(prioridad)) errores.idPrioridad = 'Selecciona una prioridad existente y activa.';
  if (!ctx.campus.some((c) => activo(c) && c.nombre === datos?.ubicacionCampus)) {
    errores.ubicacionCampus = 'Selecciona un campus existente.';
  }
  if (numArchivos > MAX_ARCHIVOS) errores.archivos = 'Puedes adjuntar hasta 3 archivos.';
  if (Object.keys(errores).length) {
    return { status: 400, body: problema(400, 'validacion', 'Solicitud inválida', 'Hay campos inválidos.', instance, errores) };
  }
  const id = ctx.siguienteNumero;
  const codigo = `SOL-${ctx.ahora.getUTCFullYear()}-${String(id).padStart(4, '0')}`;
  return {
    status: 201,
    location: `/api/v1/solicitudes/${id}`,
    body: {
      id,
      codigo,
      estado: 'REGISTRADA',
      fechaRegistro: ctx.ahora.toISOString(),
      fechaLimiteSla: sumarHoras(ctx.ahora, prioridad.slaMaxHoras),
      mensaje: 'Solicitud registrada con éxito',
    },
  };
}
