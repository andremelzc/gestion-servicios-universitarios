import { useCallback, useState } from 'react';

/**
 * Mensaje de la región `aria-live` (`RegionAviso`): `anunciar(texto)` lo publica y `limpiar()` lo
 * vacía. Cada acción nueva debe limpiarlo al empezar, para no dejar un aviso viejo en pantalla.
 */
export default function useAviso() {
  const [mensaje, setMensaje] = useState('');
  const anunciar = useCallback((texto) => setMensaje(texto), []);
  const limpiar = useCallback(() => setMensaje(''), []);
  return { mensaje, anunciar, limpiar };
}
