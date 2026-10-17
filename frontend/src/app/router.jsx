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
import NotFoundPage from './NotFoundPage.jsx';

// Mapa de rutas: docs/01-definicion/ux-ui-prototipo.md §3.
// Sin protección por sesión/rol todavía (ProtectedRoute/RoleRoute: issue #32).
export const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegistroPage /> },
  { path: '/mis-solicitudes', element: <MisSolicitudesPage /> },
  { path: '/solicitudes/nueva', element: <NuevaSolicitudPage /> },
  { path: '/solicitudes/:id', element: <DetalleSolicitudPage /> },
  { path: '/perfil', element: <PerfilPage /> },
  { path: '/bandeja', element: <BandejaPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/admin', element: <Navigate to="/admin/usuarios" replace /> },
  { path: '/admin/usuarios', element: <UsuariosPage /> },
  { path: '/admin/areas', element: <AreasPage /> },
  { path: '/admin/categorias', element: <CategoriasPage /> },
  { path: '/admin/prioridades', element: <PrioridadesPage /> },
  { path: '/admin/estados', element: <EstadosPage /> },
  { path: '*', element: <NotFoundPage /> },
];
