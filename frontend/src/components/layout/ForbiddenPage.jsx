import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ForbiddenPage.css';

// Página 403 (UX §9, "Sin permiso"). "Mis solicitudes" es la única pantalla permitida a todos los roles.
export default function ForbiddenPage() {
  const tituloRef = useRef(null);

  // Al aparecer sin navegación visible, el foco pasa al título para que el lector de pantalla lo anuncie.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <main className="acceso-denegado">
      <h1 ref={tituloRef} tabIndex={-1} className="acceso-denegado__titulo">
        Acceso no permitido
      </h1>
      <p>No tienes permiso para realizar esta acción.</p>
      <Link className="acceso-denegado__enlace" to="/mis-solicitudes">
        Ir a Mis solicitudes
      </Link>
    </main>
  );
}
