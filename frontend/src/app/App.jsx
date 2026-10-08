import { useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Providers from './providers.jsx';
import { routes } from './router.jsx';

export default function App() {
  // El router se crea una sola vez por montaje; en pruebas cada render parte de la URL actual.
  const [router] = useState(() => createBrowserRouter(routes));

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
