// Servicio del dashboard (API §3.4, arquitectura §4.2: `services/*.api.js` por recurso).
// Todos los endpoints aceptan `desde`/`hasta` (ISO, por `fechaRegistro`; por defecto, últimos 30
// días) e `idArea` (solo lo respeta el backend para ADMIN, RN-16). `apiClient` no arma query
// strings: se construye aquí y se anexa a la ruta relativa.
import { apiClient } from './apiClient.js';

const PARAMETROS = ['desde', 'hasta', 'idArea'];

/** Query string (`?desde=…&hasta=…&idArea=…`) con solo los filtros informados; `''` si no hay. */
export function construirConsulta(filtros = {}) {
  const consulta = new URLSearchParams();
  for (const nombre of PARAMETROS) {
    const valor = filtros?.[nombre];
    if (valor !== undefined && valor !== null && valor !== '') {
      consulta.set(nombre, String(valor));
    }
  }
  const texto = consulta.toString();
  return texto ? `?${texto}` : '';
}

// `opciones.signal` permite cancelar la petición (AbortController) al cambiar de filtro.
function obtener(ruta, filtros, opciones) {
  return apiClient.get(`/dashboard/${ruta}${construirConsulta(filtros)}`, opciones);
}

export const dashboardApi = {
  kpis: (filtros, opciones) => obtener('kpis', filtros, opciones),
  porCategoria: (filtros, opciones) => obtener('por-categoria', filtros, opciones),
  porPrioridad: (filtros, opciones) => obtener('por-prioridad', filtros, opciones),
  porEstado: (filtros, opciones) => obtener('por-estado', filtros, opciones),
  porResponsable: (filtros, opciones) => obtener('por-responsable', filtros, opciones),
};
