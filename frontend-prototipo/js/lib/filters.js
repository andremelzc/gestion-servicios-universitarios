// Filtrado y paginación en cliente de listas de SolicitudResumen.

export const GRUPOS_ESTADO = {
  porAsignar: ['REGISTRADA', 'EN_EVALUACION'],
  enCurso: ['ASIGNADA', 'EN_ATENCION'],
  resueltas: ['RESUELTA', 'CERRADA'],
};

export const normalizarTexto = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function filtrarSolicitudes(items, { estado, estados, prioridad, q } = {}) {
  const termino = normalizarTexto(q);
  const permitidos = estado ? [estado] : estados;
  return items.filter((s) => {
    if (permitidos?.length && !permitidos.includes(s.estado)) return false;
    if (prioridad && s.prioridad !== prioridad) return false;
    if (termino) {
      const pajar = `${normalizarTexto(s.codigo)} ${normalizarTexto(s.titulo)}`;
      if (!pajar.includes(termino)) return false;
    }
    return true;
  });
}

export function paginar(items, page, size) {
  const totalPages = Math.ceil(items.length / size);
  const actual = Math.max(0, Math.min(page, totalPages - 1));
  return {
    content: items.slice(actual * size, actual * size + size),
    page: totalPages === 0 ? 0 : actual,
    size,
    totalElements: items.length,
    totalPages,
  };
}
