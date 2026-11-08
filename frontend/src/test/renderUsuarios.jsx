import { render } from '@testing-library/react';
import { afterEach } from 'vitest';
import { AuthProvider, STORAGE_KEY } from '../features/auth/AuthContext.jsx';
import UsuariosPage from '../features/admin/pages/UsuariosPage.jsx';
import { fijarSesionUsuarios } from './handlers/admin.usuarios.js';

afterEach(() => localStorage.clear());

// Id de un administrador de la sesión que no figura en el listado sembrado: así, salvo que una
// prueba pida lo contrario, ninguna fila es "la propia" (CA-11).
const ID_SESION_AJENA = 99;

/**
 * Monta `UsuariosPage` con una sesión de administrador (la pantalla lee `useAuth` para no
 * ofrecer la baja de la cuenta propia). `idSesion` es el id del usuario de la sesión; el mock de
 * `/admin/usuarios` lo usa para responder 409 si se intenta desactivarlo.
 */
export function renderizarUsuarios({ idSesion = ID_SESION_AJENA } = {}) {
  fijarSesionUsuarios(idSesion);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: 'token-de-prueba',
      usuario: { id: idSesion, nombre: 'Sesión', rol: 'ADMIN' },
    }),
  );
  return render(
    <AuthProvider>
      <UsuariosPage />
    </AuthProvider>,
  );
}
