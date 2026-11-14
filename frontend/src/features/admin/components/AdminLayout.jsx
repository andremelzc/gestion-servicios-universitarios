import { Outlet } from 'react-router-dom';

/**
 * Marco común de las pantallas /admin/* (ADM-13). La navegación entre secciones vive en el menú
 * lateral del shell (AppShell), en su grupo "Administración"; aquí solo se resuelve la ruta hija. No aplica la guardia de rol: el router lo anida dentro de
 * `RoleRoute(['ADMIN'])`. Cada pantalla conserva su propio `<main>` y `<h1>`.
 */
export default function AdminLayout() {
  return <Outlet />;
}
