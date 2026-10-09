import { create } from 'zustand';
import { authAdapter } from '../adapters/http/AuthAdapter';

export const useAuthStore = create((set, get) => ({
  session: null,
  isLoading: false,
  error: null,

  login: async (correo, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authAdapter.login(correo, password);
      set({ session, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al iniciar sesión',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    set({ session: null });
  },

  isAuthenticated: () => get().session !== null,
}));
