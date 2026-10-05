import { create } from 'zustand';
import { AuthSession, Usuario } from '../domain/models/Auth';
import { authAdapter } from '../adapters/http/AuthAdapter';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: false,
  error: null,

  login: async (correo, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authAdapter.login(correo, password);
      set({ session, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Error al iniciar sesión', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    set({ session: null });
  },

  isAuthenticated: () => {
    return get().session !== null;
  }
}));
