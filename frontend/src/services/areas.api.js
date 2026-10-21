// Servicio de áreas (API §3.5: lectura para cualquier usuario autenticado; solo activas por
// defecto, RN-14). Alimenta el filtro Área del dashboard (solo ADMIN, RN-16).
import { apiClient } from './apiClient.js';

export const areasApi = {
  listar: (opciones) => apiClient.get('/areas', opciones),
};
