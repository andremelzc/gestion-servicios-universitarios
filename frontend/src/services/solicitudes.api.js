// Servicio de la bandeja de gestión (api-rest §3.2, §3.5, §3.6). Solo llama al API: no guarda
// estado. `apiClient` ignora la opción `params`, así que la query string se arma aquí.
import { etiquetaPrioridad } from '../components/ui/catalogos.js';
import { apiClient } from './apiClient.js';

const TAMANO_PAGINA = 20;

/**
 * Arma la query string de `GET /solicitudes`. Omite lo vacío; `estados` se repite por código
 * (`estado=A&estado=B`) y `vencidas` solo viaja cuando es verdadero.
 */
export function construirConsulta({
  estados = [],
  idPrioridad,
  idCategoria,
  idTecnico,
  q,
  vencidas,
  page = 0,
  size = TAMANO_PAGINA,
} = {}) {
  const params = new URLSearchParams();
  estados.forEach((estado) => params.append('estado', estado));
  const simples = { idPrioridad, idCategoria, idTecnico, q: q?.trim() };
  Object.entries(simples).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(clave, valor);
  });
  if (vencidas) params.set('vencidas', 'true');
  if (page > 0) params.set('page', page);
  if (size !== TAMANO_PAGINA) params.set('size', size);
  return params.toString();
}

/**
 * Bandeja con alcance por rol. Devuelve `{ data, page }`, con `page` en el formato que espera
 * `DataTable`. Acepta el sobre de api-rest §2.3 (`page`) y el de Spring (`number`).
 */
export async function listarBandeja(consulta = '', { signal } = {}) {
  const sobre = await apiClient.get(`/solicitudes${consulta ? `?${consulta}` : ''}`, { signal });
  return {
    data: sobre.content ?? [],
    page: {
      page: sobre.page ?? sobre.number ?? 0,
      size: sobre.size,
      totalElements: sobre.totalElements,
      totalPages: sobre.totalPages,
    },
  };
}

export const listarTecnicos = (opciones) => apiClient.get('/usuarios/tecnicos', opciones);
export const listarCategorias = (opciones) => apiClient.get('/categorias', opciones);

/** `GET /prioridades` entrega `nivel` ("ALTA"); el modal de asignación espera `{id, nombre}`. */
export async function listarPrioridades(opciones) {
  const prioridades = await apiClient.get('/prioridades', opciones);
  return prioridades
    .filter((p) => p.activo !== false)
    .map((p) => ({ id: p.id, nombre: etiquetaPrioridad(p.nivel) }));
}

// El backend aún no expone `/evaluar` (la fachada va con MSW hasta que exista).
export const evaluar = (id, cuerpo) => apiClient.put(`/solicitudes/${id}/evaluar`, cuerpo);
export const asignar = (id, cuerpo) => apiClient.put(`/solicitudes/${id}/asignar`, cuerpo);
export const iniciarAtencion = (id) => apiClient.put(`/solicitudes/${id}/iniciar-atencion`);

/**
 * `PUT …/resolver` es multipart (api-rest §3.2): parte `datos` = Blob JSON `{informe}` y una
 * parte `archivos` por evidencia. `apiClient` deja pasar el `FormData` sin forzar `Content-Type`
 * (el navegador agrega el boundary).
 */
export function resolver(id, { informe, archivos }) {
  const cuerpo = new FormData();
  cuerpo.append('datos', new Blob([JSON.stringify({ informe })], { type: 'application/json' }));
  archivos.forEach((archivo) => cuerpo.append('archivos', archivo));
  return apiClient.put(`/solicitudes/${id}/resolver`, cuerpo);
}
