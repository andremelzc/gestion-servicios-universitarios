// Fuente única del acceso por rol (docs/01-definicion/ux-ui-prototipo.md §3 y api-rest §4).
// La usan router.jsx (guardias) y LoginPage (decidir si se puede volver al origen).
export const ROLES_GESTION = ['TECNICO', 'SUPERVISOR', 'ADMIN'];
export const ROLES_ADMIN = ['ADMIN'];

const esRuta = (pathname, base) => pathname === base || pathname.startsWith(`${base}/`);

// Las rutas con sesión pero sin restricción de rol (p. ej. /mis-solicitudes) devuelven true.
// En las restringidas se deniega por defecto: un rol ausente o desconocido no coincide.
export function rolPuedeAcceder(rol, pathname) {
  if (esRuta(pathname, '/admin')) return ROLES_ADMIN.includes(rol);
  if (esRuta(pathname, '/bandeja') || esRuta(pathname, '/dashboard')) {
    return ROLES_GESTION.includes(rol);
  }
  return true;
}
