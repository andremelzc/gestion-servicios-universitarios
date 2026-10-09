import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Providers from './providers.jsx';
import { routes } from './router.jsx';

// Se crea una sola vez a nivel de módulo: crearlo en el render (p. ej. useState bajo
// StrictMode) registra un listener de popstate por cada instancia y los filtra.
// Las pruebas siguen usando `createMemoryRouter(routes)` con el mismo arreglo de rutas.
const router = createBrowserRouter(routes);

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
