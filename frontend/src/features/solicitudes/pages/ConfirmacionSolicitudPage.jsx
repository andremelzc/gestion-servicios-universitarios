// Pantalla de confirmación tras registrar una solicitud (REG-17 · US-07; CA-1, W-03).
// - Recibe `{ id, codigo }` en el state de la navegación desde NuevaSolicitudPage (REG-15).
// - Muestra el estado inicial `REGISTRADA` (toda solicitud nace así, RN-23), el código y el
//   microcopy de UX §9, con enlaces a "Ver mi solicitud" y "Registrar otra".
// - Sin state (recarga directa o URL manual) no hay código que confirmar: se vuelve a
//   /mis-solicitudes con `replace`.
import { Link, Navigate, useLocation } from 'react-router-dom';
import { etiquetaEstado } from '../../../components/ui/catalogos.js';
import './ConfirmacionSolicitudPage.css';

export default function ConfirmacionSolicitudPage() {
  const { state } = useLocation();
  const codigo = state?.codigo;
  const id = state?.id;

  if (!codigo) return <Navigate to="/mis-solicitudes" replace />;

  // Con `id` se enlaza al detalle; si no llegara, el respaldo es el listado.
  const destinoDetalle = id != null ? `/solicitudes/${id}` : '/mis-solicitudes';

  return (
    <main className="confirmacion">
      <h1 className="confirmacion__titulo">Solicitud registrada</h1>

      <div className="confirmacion__panel" role="status">
        <p className="confirmacion__estado">
          <span className="confirmacion__icono" aria-hidden="true">
            ✔
          </span>{' '}
          {etiquetaEstado('REGISTRADA')}: <strong>{codigo}</strong>
        </p>
        <p className="confirmacion__aviso">
          Tu solicitud <strong>{codigo}</strong> fue registrada. Te avisaremos cuando cambie de
          estado.
        </p>
      </div>

      <div className="confirmacion__acciones">
        <Link className="confirmacion__accion" to={destinoDetalle}>
          Ver mi solicitud
        </Link>
        <Link
          className="confirmacion__accion confirmacion__accion--secundaria"
          to="/solicitudes/nueva"
        >
          Registrar otra
        </Link>
      </div>
    </main>
  );
}
