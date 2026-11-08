import { beforeEach, describe, expect, it } from 'vitest';
import { fijarSesionUsuarios, reiniciarUsuarios } from './admin.usuarios.js';

const baja = (id) => fetch(`http://localhost/api/v1/admin/usuarios/${id}`, { method: 'DELETE' });

beforeEach(() => reiniciarUsuarios());

describe('mock de /admin/usuarios: protecciones de la baja (CA-11)', () => {
  it('[US-34 CA-11] desactivar al usuario de la sesión responde 409', async () => {
    fijarSesionUsuarios(2); // Luis Gómez, técnico
    const respuesta = await baja(2);

    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).detail).toBe('No puedes desactivar tu propia cuenta.');
  });

  it('[US-34 CA-10] desactivar a otro usuario responde 204', async () => {
    fijarSesionUsuarios(99);

    expect((await baja(2)).status).toBe(204);
  });
});
