// Normalización de errores a texto de UI (arquitectura-tecnica §4.2, junto a apiClient).
// Microcopy de docs/01-definicion/ux-ui-prototipo.md §9.
const INESPERADO = 'Ocurrió un error inesperado.';
const SIN_CONEXION = 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.';
const TRANSICION_INVALIDA =
  'Esta solicitud ya cambió de estado. Actualiza la página para ver su situación actual.';
const MENSAJES = {
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.',
  429: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

/**
 * Traduce el error normalizado por apiClient a `{general, campos}`:
 * `{status, detail, errores, traceId, tipo?, sinConexion?}` (ADR-012). Nunca lee `error.message`.
 * - `campos`: mapa campo → mensaje (solo 400 con `errores`).
 * - `general`: aviso que no pertenece a un campo. Los campos de `errores` que no estén en
 *   `camposConocidos` también pasan a `general`; si no se indica, todos quedan en `campos`.
 * - `tipo`: último segmento del `type` RFC 7807 (p. ej. `transicion-invalida`). La API usa el
 *   mismo 409 para una transición inválida y para reglas de negocio (RN-07, duplicados), y solo
 *   `tipo` permite distinguirlos: ADR-012 debería conservarlo. Sin `tipo`, un 409 con `detail`
 *   muestra el `detail`; sin `detail`, el texto de transición de §9.
 */
export function interpretarError(error, camposConocidos) {
  if (!error) return { general: null, campos: {} };
  const { status, detail, errores, traceId, tipo, sinConexion } = error;
  const sola = (general) => ({ general, campos: {} });

  if (sinConexion || status === 0) return sola(SIN_CONEXION);
  if (MENSAJES[status]) return sola(MENSAJES[status]);
  if (status === 409)
    return sola(
      tipo === 'transicion-invalida' ? TRANSICION_INVALIDA : detail || TRANSICION_INVALIDA,
    );
  if (status === 400) {
    const campos = errores ?? {};
    if (Object.keys(campos).length === 0) return sola(detail || INESPERADO);
    const otros = camposConocidos
      ? Object.entries(campos).filter(([campo]) => !camposConocidos.includes(campo))
      : [];
    return { general: otros.map(([, mensaje]) => mensaje).join(' ') || null, campos };
  }
  if (status >= 500 || status === 401) {
    return sola(
      traceId
        ? `${INESPERADO} Si persiste, informa este código de soporte: ${traceId}.`
        : INESPERADO,
    );
  }
  return sola(detail || INESPERADO);
}
