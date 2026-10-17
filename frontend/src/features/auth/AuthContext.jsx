import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../services/apiClient.js';

// Clave única de sesión (backlog AUTH-03; ADR-004: solo JWT + usuario, sin datos sensibles extra).
export const STORAGE_KEY = 'gestion_univ_auth';

function base64UrlADecodificada(segmento) {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(relleno);
}

// Extrae `exp` (segundos) del payload sin verificar firma — solo para caducidad local.
// Sin `exp` se considera válida (el backend la rechaza con 401 si no sirve).
export function leerExpiracionMs(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlADecodificada(partes[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function sesionExpirada(token) {
  const expiraMs = leerExpiracionMs(token);
  return expiraMs != null && expiraMs <= Date.now();
}

function leerSesionPersistida() {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo);
    if (
      !sesion ||
      typeof sesion.token !== 'string' ||
      typeof sesion.usuario !== 'object' ||
      sesion.usuario == null
    ) {
      return null;
    }
    if (sesionExpirada(sesion.token)) return null;
    return { token: sesion.token, usuario: sesion.usuario };
  } catch {
    return null;
  }
}

function persistirSesion(sesion) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    // Cuota llena o almacenamiento bloqueado: la sesión en memoria sigue funcionando.
  }
}

function borrarSesionPersistida() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}

// Normaliza cualquier respuesta de auth a `{token, usuario}` (contrato api-rest §3.1).
function aSesion(cuerpo) {
  return { token: cuerpo.token, usuario: cuerpo.usuario };
}

// POST de autenticación por el cliente único (AUTH-15): normaliza errores RFC 7807 igual
// que el resto de la app, y `/auth/login` ya está excluido del 401 global ahí mismo
// (ese 401 lo pinta LoginPage).
async function postAuth(ruta, payload) {
  const cuerpo = await apiClient.post(ruta, payload);
  if (!cuerpo || typeof cuerpo.token !== 'string') {
    // 2xx sin token: contrato roto; `interpretarError` lo pinta como error inesperado.
    throw { status: 500, detail: null, errores: {}, traceId: null };
  }
  return aSesion(cuerpo);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial: restaura la sesión y limpia si venció o está corrupta (evita parpadeo).
  // Excepción legítima a `set-state-in-effect`: la persistencia es una fuente externa,
  // no estado derivado del render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sesion = leerSesionPersistida();
    if (sesion) {
      setToken(sesion.token);
      setUsuario(sesion.usuario);
    } else {
      borrarSesionPersistida();
    }
    setIsLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(async ({ correo, password }) => {
    const sesion = await postAuth('/auth/login', { correo, password });
    persistirSesion(sesion);
    setToken(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const register = useCallback(async (datos) => {
    const sesion = await postAuth('/auth/registro', datos);
    persistirSesion(sesion);
    setToken(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const logout = useCallback(() => {
    borrarSesionPersistida();
    setToken(null);
    setUsuario(null);
  }, []);

  const updateUsuario = useCallback(
    (cambios) => {
      setUsuario((previo) => {
        if (!previo || !token) return previo;
        const actualizado = { ...previo, ...cambios };
        persistirSesion({ token, usuario: actualizado });
        return actualizado;
      });
    },
    [token],
  );

  const value = useMemo(
    () => ({
      token,
      usuario,
      isAuthenticated: token != null && usuario != null,
      isLoading,
      login,
      register,
      logout,
      updateUsuario,
    }),
    [token, usuario, isLoading, login, register, logout, updateUsuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
