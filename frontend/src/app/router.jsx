import { Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegistroPage from '../features/auth/pages/RegistroPage.jsx';
import PerfilPage from '../features/auth/pages/PerfilPage.jsx';
import MisSolicitudesPage from '../features/solicitudes/pages/MisSolicitudesPage.jsx';
import NuevaSolicitudPage from '../features/solicitudes/pages/NuevaSolicitudPage.jsx';
import ConfirmacionSolicitudPage from '../features/solicitudes/pages/ConfirmacionSolicitudPage.jsx';
import DetalleSolicitudPage from '../features/solicitudes/pages/DetalleSolicitudPage.jsx';
import BandejaPage from '../features/gestion/pages/BandejaPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import UsuariosPage from '../features/admin/pages/UsuariosPage.jsx';
import AreasPage from '../features/admin/pages/AreasPage.jsx';
import CategoriasPage from '../features/admin/pages/CategoriasPage.jsx';
import PrioridadesPage from '../features/admin/pages/PrioridadesPage.jsx';
import EstadosPage from '../features/admin/pages/EstadosPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import AppShell from '../components/layout/AppShell.jsx';

// Mapa de rutas: docs/01-definicion/ux-ui-prototipo.md §3.
// El área "Aplicación (requiere sesión)" se envuelve en el AppShell (menú de usuario y
// cierre de sesión: AUTH-19). Sin protección por sesión/rol todavía (issue #32).
const conShell = (elemento) => <AppShell>{elemento}</AppShell>;

export const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegistroPage /> },
  { path: '/mis-solicitudes', element: conShell(<MisSolicitudesPage />) },
  { path: '/solicitudes/nueva', element: conShell(<NuevaSolicitudPage />) },
  { path: '/solicitudes/confirmacion', element: conShell(<ConfirmacionSolicitudPage />) },
  { path: '/solicitudes/:id', element: conShell(<DetalleSolicitudPage />) },
  { path: '/perfil', element: conShell(<PerfilPage />) },
  { path: '/bandeja', element: conShell(<BandejaPage />) },
  { path: '/dashboard', element: conShell(<DashboardPage />) },
  { path: '/admin', element: <Navigate to="/admin/usuarios" replace /> },
  { path: '/admin/usuarios', element: conShell(<UsuariosPage />) },
  { path: '/admin/areas', element: conShell(<AreasPage />) },
  { path: '/admin/categorias', element: conShell(<CategoriasPage />) },
  { path: '/admin/prioridades', element: conShell(<PrioridadesPage />) },
  { path: '/admin/estados', element: conShell(<EstadosPage />) },
  { path: '*', element: <NotFoundPage /> },
];
