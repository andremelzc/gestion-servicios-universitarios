import { vi } from 'vitest';

// jsdom no implementa `matchMedia`: se simula un ancho móvil o de escritorio.
// Devuelve `cambiar(esEscritorio)` para disparar el evento `change` y `lista` para inspeccionarla.
export function simularAncho(esEscritorio, { conAddEventListener = true } = {}) {
  const oyentes = new Set();
  const lista = {
    matches: esEscritorio,
    media: '',
    addListener: vi.fn((fn) => oyentes.add(fn)),
    removeListener: vi.fn((fn) => oyentes.delete(fn)),
  };
  if (conAddEventListener) {
    lista.addEventListener = vi.fn((_evento, fn) => oyentes.add(fn));
    lista.removeEventListener = vi.fn((_evento, fn) => oyentes.delete(fn));
  }
  window.matchMedia = vi.fn().mockImplementation(() => lista);
  return {
    lista,
    oyentes,
    cambiar(valor) {
      lista.matches = valor;
      oyentes.forEach((fn) => fn({ matches: valor }));
    },
  };
}

export function restaurarAncho() {
  delete window.matchMedia;
}
