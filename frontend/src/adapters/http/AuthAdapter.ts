import axios from 'axios';
import type { AuthPort } from '../../ports/api/AuthPort';
import type { AuthSession } from '../../domain/models/Auth';

// Lee la URL base desde las variables de entorno, o usa localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const authAdapter: AuthPort = {
  login: async (correo: string, password: string): Promise<AuthSession> => {
    const response = await axios.post(`${API_URL}/auth/login`, { correo, password });
    const { token, tipo, correo: email, rol, idArea } = response.data;
    
    return {
      token,
      tipo,
      usuario: {
        correo: email,
        rol,
        idArea
      }
    };
  }
};
