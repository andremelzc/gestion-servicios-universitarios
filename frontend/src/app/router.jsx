import { Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegistroPage from '../features/auth/pages/RegistroPage.jsx';
import PerfilPage from '../features/auth/pages/PerfilPage.jsx';
import MisSolicitudesPage from '../features/solicitudes/pages/MisSolicitudesPage.jsx';
import NuevaSolicitudPage from '../features/solicitudes/pages/NuevaSolicitudPage.jsx';
import DetalleSolicitudPage from '../features/solicitudes/pages/DetalleSolicitudPage.jsx';
import BandejaPage from '../features/gestion/pages/BandejaPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import UsuariosPage from '../features/admin/pages/UsuariosPage.jsx';
import AreasPage from '../features/admin/pages/AreasPage.jsx';
import CategoriasPage from '../features/admin/pages/CategoriasPage.jsx';
import PrioridadesPage from '../features/admin/pages/PrioridadesPage.jsx';
import EstadosPage from '../features/admin/pages/EstadosPage.jsx';
import AdminLayout from '../features/admin/components/AdminLayout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import RoleRoute from '../components/layout/RoleRoute.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import { ROLES_ADMIN, ROLES_GESTION } from './rutasAcceso.js';

// Mapa de rutas y acceso por rol: docs/01-definicion/ux-ui-prototipo.md §3 (AUTH-18).
// Públicas: /login y /registro. El resto exige sesión (ProtectedRoute) y, donde aplica, rol (RoleRoute).
// El área "Aplicación (requiere sesión)" se envuelve en el AppShell (menú de usuario y cierre de
// sesión: AUTH-19). El shell va DENTRO de los guards: sin sesión o sin rol no se llega a pintarlo.
const conShell = (elemento) => <AppShell>{elemento}</AppShell>;

export const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegistroPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/mis-solicitudes', element: conShell(<MisSolicitudesPage />) },
      { path: '/solicitudes/nueva', element: conShell(<NuevaSolicitudPage />) },
      { path: '/solicitudes/:id', element: conShell(<DetalleSolicitudPage />) },
      { path: '/perfil', element: conShell(<PerfilPage />) },
      {
        element: <RoleRoute allowedRoles={ROLES_GESTION} />,
        children: [
          { path: '/bandeja', element: conShell(<BandejaPage />) },
          { path: '/dashboard', element: conShell(<DashboardPage />) },
        ],
      },
      {
        element: <RoleRoute allowedRoles={ROLES_ADMIN} />,
        children: [
          { path: '/admin', element: <Navigate to="/admin/usuarios" replace /> },
          {
            // ADM-13: las pantallas de administración comparten el menú lateral (AdminLayout),
            // dentro del AppShell: el shell aporta cabecera y sesión; el layout, la navegación de /admin.
            element: conShell(<AdminLayout />),
            children: [
              { path: '/admin/usuarios', element: <UsuariosPage /> },
              { path: '/admin/areas', element: <AreasPage /> },
              { path: '/admin/categorias', element: <CategoriasPage /> },
              { path: '/admin/prioridades', element: <PrioridadesPage /> },
              { path: '/admin/estados', element: <EstadosPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
