import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegistroPage from '../features/auth/pages/RegistroPage.jsx';
import PerfilPage from '../features/auth/pages/PerfilPage.jsx';
import MisSolicitudesPage from '../features/solicitudes/pages/MisSolicitudesPage.jsx';
import NuevaSolicitudPage from '../features/solicitudes/pages/NuevaSolicitudPage.jsx';
import ConfirmacionSolicitudPage from '../features/solicitudes/pages/ConfirmacionSolicitudPage.jsx';
import DetalleSolicitudPage from '../features/solicitudes/pages/DetalleSolicitudPage.jsx';
import BandejaPage from '../features/gestion/pages/BandejaPage.jsx';
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage.jsx'));
const UsuariosPage = lazy(() => import('../features/admin/pages/UsuariosPage.jsx'));
const AreasPage = lazy(() => import('../features/admin/pages/AreasPage.jsx'));
const CategoriasPage = lazy(() => import('../features/admin/pages/CategoriasPage.jsx'));
const PrioridadesPage = lazy(() => import('../features/admin/pages/PrioridadesPage.jsx'));
const EstadosPage = lazy(() => import('../features/admin/pages/EstadosPage.jsx'));
import AdminLayout from '../features/admin/components/AdminLayout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import RoleRoute from '../components/layout/RoleRoute.jsx';
import { PaginaCargando } from '../components/ui/Skeleton.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import { ROLES_ADMIN, ROLES_GESTION } from './rutasAcceso.js';

// Mapa de rutas y acceso por rol: docs/01-definicion/ux-ui-prototipo.md §3 (AUTH-18).
// Públicas: /login y /registro. El resto exige sesión (ProtectedRoute) y, donde aplica, rol (RoleRoute).
// El área "Aplicación (requiere sesión)" se envuelve en el AppShell (menú de usuario y cierre de
// sesión: AUTH-19). El shell va DENTRO de los guards: sin sesión o sin rol no se llega a pintarlo.
// AUD-12: dashboard y administración se cargan bajo demanda (recharts no entra en el paquete inicial).
const diferida = (elemento) => <Suspense fallback={<PaginaCargando />}>{elemento}</Suspense>;

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
      { path: '/solicitudes/confirmacion', element: conShell(<ConfirmacionSolicitudPage />) },
      { path: '/solicitudes/:id', element: conShell(<DetalleSolicitudPage />) },
      { path: '/perfil', element: conShell(<PerfilPage />) },
      {
        element: <RoleRoute allowedRoles={ROLES_GESTION} />,
        children: [
          { path: '/bandeja', element: conShell(<BandejaPage />) },
          { path: '/dashboard', element: conShell(diferida(<DashboardPage />)) },
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
              { path: '/admin/usuarios', element: diferida(<UsuariosPage />) },
              { path: '/admin/areas', element: diferida(<AreasPage />) },
              { path: '/admin/categorias', element: diferida(<CategoriasPage />) },
              { path: '/admin/prioridades', element: diferida(<PrioridadesPage />) },
              { path: '/admin/estados', element: diferida(<EstadosPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
