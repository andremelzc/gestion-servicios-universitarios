// Cookie de preferencias de interfaz (ADR-004, backlog UX-09). Solo tema y estado del menú:
// nunca token, perfil ni datos personales (esos viven en `gestion_univ_auth`).
export const NOMBRE_COOKIE = 'gu_prefs';
export const MAX_AGE_SEGUNDOS = 60 * 60 * 24 * 365; // 1 año.
export const TEMAS = ['claro', 'oscuro'];

// `tema: null` = sin preferencia explícita: se sigue `prefers-color-scheme` del sistema.
export const PREFERENCIAS_POR_DEFECTO = Object.freeze({ tema: null, menuColapsado: false });

// Whitelist: descarta lo desconocido o mal tipado, para que una cookie manipulada no se propague.
export function validarPreferencias(crudo) {
  if (crudo == null || typeof crudo !== 'object' || Array.isArray(crudo)) {
    return { ...PREFERENCIAS_POR_DEFECTO };
  }
  return {
    tema: TEMAS.includes(crudo.tema) ? crudo.tema : PREFERENCIAS_POR_DEFECTO.tema,
    menuColapsado:
      typeof crudo.menuColapsado === 'boolean'
        ? crudo.menuColapsado
        : PREFERENCIAS_POR_DEFECTO.menuColapsado,
  };
}

// Atributos fijos del ADR-004: `SameSite=Lax; Secure; Max-Age=1 año`. `Secure` va siempre: en
// desarrollo sobre http://localhost Safari puede no persistir la cookie (Chrome y Firefox sí).
const ATRIBUTOS = `Path=/; Max-Age=${MAX_AGE_SEGUNDOS}; SameSite=Lax; Secure`;

export function construirCookie(preferencias) {
  const { tema, menuColapsado } = validarPreferencias(preferencias);
  const valor = encodeURIComponent(JSON.stringify({ tema, menuColapsado }));
  return `${NOMBRE_COOKIE}=${valor}; ${ATRIBUTOS}`;
}

// Devuelve las preferencias de un valor crudo de cookie o `null` si no se puede interpretar.
function interpretar(valor) {
  try {
    return validarPreferencias(JSON.parse(decodeURIComponent(valor)));
  } catch {
    return null;
  }
}

export function leerPreferencias() {
  // Puede haber varias `gu_prefs` (p. ej. de distinto `Path`): gana la última que valida.
  // Se compara el nombre completo para no confundir `xgu_prefs`.
  const prefijo = `${NOMBRE_COOKIE}=`;
  const validas = document.cookie
    .split('; ')
    .filter((fragmento) => fragmento.startsWith(prefijo))
    .map((fragmento) => interpretar(fragmento.slice(prefijo.length)))
    .filter(Boolean);
  // Sin cookie válida (ausente o corrupta) se usan los valores por defecto.
  return validas.at(-1) ?? { ...PREFERENCIAS_POR_DEFECTO };
}

export function escribirPreferencias(preferencias) {
  document.cookie = construirCookie(preferencias);
}

// Relee la cookie y fusiona solo lo cambiado: otra pestaña pudo modificar la otra clave.
export function actualizarPreferencias(cambio) {
  const siguientes = validarPreferencias({ ...leerPreferencias(), ...cambio });
  escribirPreferencias(siguientes);
  return siguientes;
}

export function borrarPreferencias() {
  document.cookie = `${NOMBRE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}
