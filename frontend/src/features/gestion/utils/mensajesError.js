// Microcopy de docs/01-definicion/ux-ui-prototipo.md §9.
const MENSAJES = {
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.',
  409: 'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.',
};

// Traduce el error normalizado `{status, detail, errores, traceId}` (ADR-012) a texto para la UI:
// `campos` mapea campo → mensaje y `general` reúne lo que no pertenece a un campo conocido.
export function interpretarError(error, camposConocidos = ['idTecnico', 'idPrioridad', 'nota']) {
  if (!error) return { general: null, campos: {} };
  if (MENSAJES[error.status]) return { general: MENSAJES[error.status], campos: {} };

  if (error.status === 400) {
    const errores = error.errores ?? {};
    const otros = Object.entries(errores)
      .filter(([campo]) => !camposConocidos.includes(campo))
      .map(([, mensaje]) => mensaje);
    const general = Object.keys(errores).length === 0 ? error.detail : otros.join(' ') || null;
    return { general, campos: errores };
  }

  const soporte = error.traceId
    ? `informa este código de soporte: ${error.traceId}.`
    : 'vuelve a intentarlo más tarde.';
  return { general: `Ocurrió un error inesperado. Si persiste, ${soporte}`, campos: {} };
}
