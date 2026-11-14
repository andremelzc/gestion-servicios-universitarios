import { Link } from 'react-router-dom';
import { useTituloPagina } from './titulos.js';
import MarcaGisu from '../components/layout/MarcaGisu.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function NotFoundPage() {
  useTituloPagina('Página no encontrada');
  return (
    <main className="ui-pagina-vacia">
      <MarcaGisu />
      <EmptyState
        grande
        icono="search"
        tono="primario"
        tituloComo="h1"
        titulo="Página no encontrada"
        descripcion="La dirección que buscas no existe o fue movida."
        acciones={
          <Button como={Link} to="/login" icono="arrowLeft">
            Volver al inicio
          </Button>
        }
      />
    </main>
  );
}
