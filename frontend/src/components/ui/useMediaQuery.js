import { useCallback, useSyncExternalStore } from 'react';

// Sin `matchMedia` (p. ej. jsdom) se asume que la consulta se cumple.
function obtenerLista(query) {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null;
}

/** Indica si se cumple una media query y se actualiza cuando cambia. */
export default function useMediaQuery(query) {
  // `subscribe` estable por `query`: si cambiara en cada render, React se resuscribiría siempre.
  const subscribe = useCallback(
    (avisar) => {
      const lista = obtenerLista(query);
      if (!lista) return () => {};
      // Safari < 14 solo conoce `addListener`/`removeListener`.
      if (lista.addEventListener) lista.addEventListener('change', avisar);
      else lista.addListener?.(avisar);
      return () => {
        if (lista.removeEventListener) lista.removeEventListener('change', avisar);
        else lista.removeListener?.(avisar);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => obtenerLista(query)?.matches ?? true,
    () => true,
  );
}
