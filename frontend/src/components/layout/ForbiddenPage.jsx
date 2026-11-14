import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTituloPagina } from '../../app/titulos.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import './ForbiddenPage.css';

// Página 403 (UX §9, "Sin permiso"). "Mis solicitudes" es la única pantalla permitida a todos los roles.
export default function ForbiddenPage() {
  const tituloRef = useRef(null);
  useTituloPagina('Acceso no permitido');

  // Al aparecer sin navegación visible, el foco pasa al título para que el lector de pantalla lo anuncie.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <main className="acceso-denegado">
      <EmptyState
        grande
        icono="shield"
        tono="advertencia"
        tituloComo="h1"
        tituloProps={{
          ref: tituloRef,
          tabIndex: -1,
          className: 'ui-vacio__titulo acceso-denegado__titulo',
        }}
        titulo="Acceso no permitido"
        descripcion="No tienes permiso para realizar esta acción."
        acciones={
          <Button como={Link} to="/mis-solicitudes">
            Ir a Mis solicitudes
          </Button>
        }
      />
    </main>
  );
}
