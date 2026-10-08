import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o fue movida.</p>
      <Link to="/login">Volver al inicio</Link>
    </main>
  );
}
