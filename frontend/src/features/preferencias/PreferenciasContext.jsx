import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  TEMAS,
  actualizarPreferencias,
  leerPreferencias,
} from '../../services/cookiePreferencias.js';

const PreferenciasContext = createContext(null);

const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

function listaSistema() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(CONSULTA_OSCURO)
    : null;
}

// Suscripción propia (no `useMediaQuery`): sin `matchMedia` el tema del sistema es claro,
// mientras que `useMediaQuery` asume que la consulta se cumple.
function suscribirSistema(avisar) {
  const lista = listaSistema();
  if (!lista) return () => {};
  // Safari < 14 solo conoce `addListener`/`removeListener`.
  if (lista.addEventListener) lista.addEventListener('change', avisar);
  else lista.addListener?.(avisar);
  return () => {
    if (lista.removeEventListener) lista.removeEventListener('change', avisar);
    else lista.removeListener?.(avisar);
  };
}

const sistemaEsOscuro = () => listaSistema()?.matches ?? false;

/**
 * Refleja el tema en `<html data-theme>`. Sin preferencia (`null`) se quita el atributo y manda
 * `prefers-color-scheme` del sistema.
 *
 * LIMITACIÓN: hoy `data-theme="oscuro"` NO tiene efecto visual. UX §2.1 deja el modo oscuro fuera
 * del alcance mínimo y no define su paleta; cuando se defina, bastará un bloque
 * `:root[data-theme='oscuro']` (y su equivalente por `prefers-color-scheme`) en `tokens.css`.
 */
export function aplicarTema(tema) {
  const raiz = document.documentElement;
  if (tema) raiz.setAttribute('data-theme', tema);
  else raiz.removeAttribute('data-theme');
}

// Preferencias de interfaz persistidas en la cookie `gu_prefs` (ADR-004, UX-09).
export function PreferenciasProvider({ children }) {
  const [preferencias, setPreferencias] = useState(leerPreferencias);
  const sistemaOscuro = useSyncExternalStore(suscribirSistema, sistemaEsOscuro, () => false);

  // Layout effect: se aplica antes del primer pintado (main.jsx ya lo hace antes de montar).
  useLayoutEffect(() => aplicarTema(preferencias.tema), [preferencias.tema]);

  // Se escribe desde el manejador (no al montar): relee la cookie y fusiona solo lo cambiado.
  const cambiar = useCallback((cambio) => setPreferencias(actualizarPreferencias(cambio)), []);

  const setTema = useCallback(
    (tema) => {
      if (tema !== null && !TEMAS.includes(tema)) return;
      cambiar({ tema });
    },
    [cambiar],
  );

  const setMenuColapsado = useCallback(
    (menuColapsado) => cambiar({ menuColapsado: Boolean(menuColapsado) }),
    [cambiar],
  );

  const alternarMenu = useCallback(
    () => cambiar({ menuColapsado: !leerPreferencias().menuColapsado }),
    [cambiar],
  );

  const valor = useMemo(
    () => ({
      tema: preferencias.tema,
      temaEfectivo: preferencias.tema ?? (sistemaOscuro ? 'oscuro' : 'claro'),
      menuColapsado: preferencias.menuColapsado,
      setTema,
      setMenuColapsado,
      alternarMenu,
    }),
    [preferencias, sistemaOscuro, setTema, setMenuColapsado, alternarMenu],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export function usePreferencias() {
  const ctx = useContext(PreferenciasContext);
  if (!ctx) throw new Error('usePreferencias debe usarse dentro de <PreferenciasProvider>');
  return ctx;
}
