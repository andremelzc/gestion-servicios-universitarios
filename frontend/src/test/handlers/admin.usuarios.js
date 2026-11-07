import { http, HttpResponse } from 'msw';
import { paginaDe } from './gestion.js';

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

/** Restablece el estado en memoria; llamar en `beforeEach` de las pruebas que mutan. */
export function reiniciarUsuarios() {
  usuarios = structuredClone(SEMILLA);
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
];
