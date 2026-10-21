import { Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import AppShell from './AppShell.jsx';
import ForbiddenPage from './ForbiddenPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

/**
 * Guardia de rol (UX §3, api-rest §4). Primero exige sesión (delegando en ProtectedRoute, que
 * también cubre `isLoading`) y luego que `usuario.rol` esté en `allowedRoles`; si no, muestra
 * la página 403 sin redirigir. Denegar por defecto: un rol ausente o desconocido nunca coincide.
 * Es solo comodidad de UI: la autorización real la aplica el backend (403/404).
 */
export default function RoleRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading || !isAuthenticated) return <ProtectedRoute />;

  if (allowedRoles.includes(usuario?.rol)) return <Outlet />;

  // Con sesión pero sin rol: la 403 va dentro del AppShell para conservar cabecera y cierre de sesión.
  return (
    <AppShell>
      <ForbiddenPage />
    </AppShell>
  );
}
