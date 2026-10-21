// Contraste de color WCAG 2.1 para el aviso de la pantalla de Estados (US-32, CA-7).
const REGEX_HEX = /^#[0-9A-Fa-f]{6}$/;
const MINIMO_ELEMENTOS_GRAFICOS = 3; // WCAG 1.4.11: la insignia y los gráficos usan el color como marca

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const canal = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste (1 a 21) entre dos colores `#RRGGBB`. */
export function razonContraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Aviso (no bloqueante) si el color se distingue poco sobre blanco; `null` si es suficiente o inválido. */
export function avisoContraste(colorHex) {
  if (!REGEX_HEX.test(colorHex)) return null;
  const razon = razonContraste(colorHex, '#FFFFFF');
  if (razon >= MINIMO_ELEMENTOS_GRAFICOS) return null;
  return `Este color tiene poco contraste con el fondo blanco (${razon.toFixed(1)}:1). Se recomienda al menos 3:1 para que el estado se distinga.`;
}
