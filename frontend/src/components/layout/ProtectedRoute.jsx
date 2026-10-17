import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';

/**
 * Guardia de sesión (UX §3: "Aplicación (requiere sesión)"). Se usa como ruta de diseño:
 * `<Route element={<ProtectedRoute />}>` envuelve a las rutas hijas.
 * - Mientras `isLoading`, no decide (evita el parpadeo hacia /login al restaurar la sesión).
 * - Sin sesión redirige a /login y guarda la ubicación en `state.from` para volver tras entrar.
 * - Para el futuro botón de cerrar sesión: debe navegar a `/login` con `state: null`, para que
 *   la siguiente persona que inicie sesión en el equipo no herede el `from` de la anterior.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <p role="status" className="sr-only">
        Cargando sesión…
      </p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
