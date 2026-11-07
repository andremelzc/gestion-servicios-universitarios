import { http, HttpResponse } from 'msw';
import { paginaDe, problema } from './gestion.js';

const ROLES = ['ESTUDIANTE', 'TECNICO', 'SUPERVISOR', 'ADMIN'];

// Contrato: docs/02-diseno/api-rest.md §3.6 y §2.3. El backend aún no tiene `/admin/usuarios`:
// estos handlers guardan el estado en memoria. Supuesto: cada usuario llega plano como
// `{id, codigoInstitucional, nombre, apellido, correo, telefono, rol, idArea, activo}` (`rol` en
// texto como en el cuerpo del PUT de §3.6; los nombres salen de la entidad `Usuario`); §3.6 no
// documenta el cuerpo del listado. Sin `activo` devuelve todos (el contrato no fija el defecto).
const SEMILLA = [
  ['U20260001', 'Ana', 'Rojas', 'ana.rojas@universidad.edu', 'ESTUDIANTE', null, true],
  ['U20260002', 'Luis', 'Gómez', 'luis.gomez@universidad.edu', 'TECNICO', 1, true],
  ['U20260003', 'Marta', 'Díaz', 'marta.diaz@universidad.edu', 'SUPERVISOR', 2, true],
  ['U20260004', 'Carlos', 'Admin', 'carlos.admin@universidad.edu', 'ADMIN', null, true],
  ['U20260005', 'Pedro', 'Inactivo', 'pedro.inactivo@universidad.edu', 'TECNICO', 1, false],
].map(([codigoInstitucional, nombre, apellido, correo, rol, idArea, activo], i) => ({
  id: i + 1,
  codigoInstitucional,
  nombre,
  apellido,
  correo,
  telefono: null,
  rol,
  idArea,
  activo,
}));

let usuarios = structuredClone(SEMILLA);
// Id del usuario de la sesión: el mock no lee el JWT, así que cada prueba lo fija (CA-11).
let idSesion = null;

/** Fija el usuario de la sesión; desactivarlo responde 409 (no se puede desactivar a sí mismo). */
export function fijarSesionUsuarios(id) {
  idSesion = id;
}

/** Restablece el estado en memoria; llamar en `beforeEach` de las pruebas que mutan. */
export function reiniciarUsuarios() {
  usuarios = structuredClone(SEMILLA);
  idSesion = null;
}

const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

function coincide(usuario, { rol, idArea, activo, q }) {
  if (rol && usuario.rol !== rol) return false;
  if (idArea && usuario.idArea !== Number(idArea)) return false;
  if (activo !== null && usuario.activo !== (activo === 'true')) return false;
  if (q) {
    const texto = normalizar(`${usuario.nombre} ${usuario.apellido} ${usuario.correo}`);
    if (!texto.includes(normalizar(q))) return false;
  }
  return true;
}

const ruta = (request) => new URL(request.url).pathname;
const buscar = (params) => usuarios.find((u) => u.id === Number(params.id));
const noEncontrado = (request) =>
  problema(404, 'no-encontrado', 'No encontrado', 'El usuario no existe.', ruta(request));

const conflicto = (detalle, request) =>
  problema(409, 'conflicto', 'Conflicto', detalle, ruta(request));

// CA-11: el último ADMIN activo no se desactiva ni cambia de rol.
const esUnicoAdmin = (usuario) =>
  usuario.rol === 'ADMIN' &&
  usuario.activo &&
  usuarios.filter((u) => u.rol === 'ADMIN' && u.activo).length === 1;

// RN-21 (CA-8): TECNICO y SUPERVISOR exigen `idArea`; ESTUDIANTE y ADMIN no la admiten.
function validar({ rol, idArea, nombre, apellido, correo }, { alta }) {
  const errores = {};
  if (!nombre?.trim()) errores.nombre = 'El nombre es obligatorio';
  if (!apellido?.trim()) errores.apellido = 'El apellido es obligatorio';
  if (!ROLES.includes(rol)) errores.rol = 'El rol no es válido.';
  else if (['TECNICO', 'SUPERVISOR'].includes(rol) && idArea == null) {
    errores.idArea = `El área es obligatoria para el rol ${rol}.`;
  } else if (!['TECNICO', 'SUPERVISOR'].includes(rol) && idArea != null) {
    errores.idArea = `El rol ${rol} no admite área.`;
  }
  if (alta && !String(correo ?? '').endsWith('@universidad.edu')) {
    errores.correo = 'Debe usar correo institucional (@universidad.edu).';
  }
  return errores;
}

// 400 por campo (RN-21, dominio) y 409 por correo repetido (CA-9); `null` si todo es correcto.
function rechazar(cuerpo, request, idActual, { alta }) {
  const errores = validar(cuerpo, { alta });
  if (Object.keys(errores).length > 0) {
    return problema(400, 'validacion', 'Validación fallida', 'Campos inválidos.', ruta(request), {
      errores,
    });
  }
  if (alta && usuarios.some((u) => u.id !== idActual && u.correo === cuerpo.correo)) {
    return conflicto('Ya existe un usuario con ese correo.', request);
  }
  return null;
}

export const handlersUsuarios = [
  http.get('*/api/v1/admin/usuarios', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const filtros = {
      rol: params.get('rol'),
      idArea: params.get('idArea'),
      activo: params.get('activo'),
      q: params.get('q'),
    };
    return HttpResponse.json(paginaDe(usuarios.filter((u) => coincide(u, filtros))));
  }),

  http.post('*/api/v1/admin/usuarios', async ({ request }) => {
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, null, { alta: true });
    if (rechazo) return rechazo;
    const nuevo = {
      id: Math.max(0, ...usuarios.map((u) => u.id)) + 1,
      codigoInstitucional: cuerpo.codigoInstitucional,
      nombre: cuerpo.nombre,
      apellido: cuerpo.apellido,
      correo: cuerpo.correo,
      telefono: cuerpo.telefono ?? null,
      rol: cuerpo.rol,
      idArea: cuerpo.idArea ?? null,
      activo: true,
    };
    usuarios.push(nuevo);
    // La contraseña nunca se devuelve (CA-9).
    return HttpResponse.json(nuevo, { status: 201 });
  }),

  http.put('*/api/v1/admin/usuarios/:id', async ({ params, request }) => {
    const usuario = buscar(params);
    if (!usuario) return noEncontrado(request);
    const cuerpo = await request.json();
    const rechazo = rechazar(cuerpo, request, usuario.id, { alta: false });
    if (rechazo) return rechazo;
    if (esUnicoAdmin(usuario) && cuerpo.rol !== 'ADMIN') {
      return conflicto('No se puede cambiar el rol del único administrador activo.', request);
    }
    const { nombre, apellido, telefono = null, rol, idArea = null } = cuerpo;
    Object.assign(usuario, { nombre, apellido, telefono, rol, idArea });
    return HttpResponse.json(usuario);
  }),

  http.put('*/api/v1/admin/usuarios/:id/reactivar', ({ params, request }) => {
    const usuario = buscar(params);
    if (!usuario) return noEncontrado(request);
    usuario.activo = true;
    return HttpResponse.json(usuario);
  }),

  // Baja lógica (RN-14). CA-11: 409 si es el usuario de la sesión o el único admin activo.
  http.delete('*/api/v1/admin/usuarios/:id', ({ params, request }) => {
    const usuario = buscar(params);
    if (!usuario) return noEncontrado(request);
    if (usuario.id === idSesion) {
      return conflicto('No puedes desactivar tu propia cuenta.', request);
    }
    if (esUnicoAdmin(usuario)) {
      return conflicto('No se puede desactivar al único administrador activo.', request);
    }
    usuario.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
