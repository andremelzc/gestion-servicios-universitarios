// Normaliza errores de la API (RFC 7807, api-rest.md §1.2) a un objeto
// consumible por la UI, con los mensajes del microcopy (ux-ui-prototipo.md §9).

export class ApiError extends Error {
  constructor(problema) {
    super(problema.mensaje);
    this.name = 'ApiError';
    this.problema = problema;
    this.status = problema.status;
  }
}

const MENSAJES_ESTADO = {
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.',
  429: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

const SIN_CONEXION = 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.';

function mensajePara(status, cuerpo, contexto, traceId) {
  if (status === 0) return SIN_CONEXION;
  if (status === 401) {
    return contexto === 'login'
      ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
      : 'Tu sesión expiró. Inicia sesión de nuevo.';
  }
  if (status === 409) {
    if (String(cuerpo?.type ?? '').endsWith('transicion-invalida')) {
      return 'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.';
    }
    return cuerpo?.detail || 'La operación entra en conflicto con el estado actual.';
  }
  if (status === 400) return cuerpo?.detail || 'Revisa los campos marcados e inténtalo de nuevo.';
  if (MENSAJES_ESTADO[status]) return MENSAJES_ESTADO[status];
  const codigo = traceId ? ` ${traceId}` : '';
  return `Ocurrió un error inesperado. Si persiste, informa este código de soporte:${codigo || ' (no disponible)'}.`;
}

export function normalizarError(status, cuerpo, { contexto } = {}) {
  const cuerpoValido = cuerpo && typeof cuerpo === 'object' ? cuerpo : null;
  const traceId = cuerpoValido?.traceId ?? null;
  return {
    status,
    title: cuerpoValido?.title ?? null,
    detail: cuerpoValido?.detail ?? null,
    errores: cuerpoValido?.errores && typeof cuerpoValido.errores === 'object' ? cuerpoValido.errores : {},
    traceId,
    mensaje: mensajePara(status, cuerpoValido, contexto, traceId),
  };
}
