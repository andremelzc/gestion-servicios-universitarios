import ForbiddenPage from '../../../components/layout/ForbiddenPage.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import BandejaSupervisorPage from './BandejaSupervisorPage.jsx';
import BandejaTecnicoPage from './BandejaTecnicoPage.jsx';

// Punto de entrada de `/bandeja` (UX §3): el técnico ve sus asignadas (W-07) y el supervisor y el
// administrador, la bandeja de su alcance (W-06). El rol llega sin prefijo `ROLE_`. Cualquier otro
// rol (estudiante, desconocido o ausente) recibe el 403: la ruta aún no tiene guardia propia, y
// por defecto se deniega. Es solo comodidad de UI; la autorización real la aplica el backend.
export default function BandejaPage() {
  const { usuario, isLoading } = useAuth();
  if (isLoading) {
    return (
      <p role="status" className="bandeja-cargando">
        Cargando…
      </p>
    );
  }
  switch (usuario?.rol) {
    case 'TECNICO':
      return <BandejaTecnicoPage />;
    case 'SUPERVISOR':
    case 'ADMIN':
      return <BandejaSupervisorPage />;
    default:
      return <ForbiddenPage />;
  }
}
