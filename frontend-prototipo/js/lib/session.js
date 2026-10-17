// Sesión simulada en localStorage (ADR-004: clave única `gestion_univ_auth`).
// Todo acceso va en try/catch: el almacenamiento puede estar bloqueado.

export const CLAVE_SESION = 'gestion_univ_auth';

export function crearSesion(storage) {
  return {
    leer() {
      try {
        const bruto = storage?.getItem(CLAVE_SESION);
        if (!bruto) return null;
        const auth = JSON.parse(bruto);
        return auth && typeof auth.token === 'string' && auth.usuario?.rol ? auth : null;
      } catch {
        return null;
      }
    },
    guardar(auth) {
      try {
        storage?.setItem(CLAVE_SESION, JSON.stringify(auth));
      } catch {
        /* sin almacenamiento: la sesión vive solo en esta página */
      }
    },
    limpiar() {
      try {
        storage?.removeItem(CLAVE_SESION);
      } catch {
        /* nada que limpiar */
      }
    },
  };
}
