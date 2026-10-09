import axios from 'axios';
import { API_URL } from '../../services/config';

export const authAdapter = {
  async login(correo, password) {
    const response = await axios.post(`${API_URL}/auth/login`, { correo, password });
    const { token, tipo, correo: email, rol, idArea } = response.data;

    return { token, tipo, usuario: { correo: email, rol, idArea } };
  },
};
