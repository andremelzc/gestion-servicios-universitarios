import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

// Secciones del módulo de administración (UX §3 y W-09). Las rutas deben coincidir con router.jsx.
const SECCIONES = [
  { to: '/admin/usuarios', etiqueta: 'Usuarios' },
  { to: '/admin/areas', etiqueta: 'Áreas' },
  { to: '/admin/categorias', etiqueta: 'Categorías' },
  { to: '/admin/prioridades', etiqueta: 'Prioridades' },
  { to: '/admin/estados', etiqueta: 'Estados' },
];

/**
 * Marco común de las pantallas /admin/* (ADM-13): menú lateral y `Outlet`.
 * No aplica la guardia de rol: el router lo anida dentro de `RoleRoute(['ADMIN'])`.
 * Cada pantalla conserva su propio `<main>` y `<h1>`; el layout solo aporta la navegación.
 * `NavLink` agrega `aria-current="page"` al enlace activo.
 */
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <nav className="admin-layout__menu" aria-label="Administración">
        <ul className="admin-layout__lista">
          {SECCIONES.map(({ to, etiqueta }) => (
            <li key={to}>
              <NavLink to={to} className="admin-layout__enlace">
                {etiqueta}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-layout__contenido">
        <Outlet />
      </div>
    </div>
  );
}
