import BandejaSupervisorPage from './BandejaSupervisorPage.jsx';

// Punto de entrada de `/bandeja`. Hoy solo existe la vista del supervisor; la del técnico (#68)
// se elige aquí según el rol.
export default function BandejaPage() {
  return <BandejaSupervisorPage />;
}
