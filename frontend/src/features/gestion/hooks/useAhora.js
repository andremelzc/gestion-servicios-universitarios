import { useEffect, useState } from 'react';

/**
 * Instante actual (ms) que se refresca cada `intervaloMs` (1 min por defecto). Sirve para que el
 * texto del SLA ("Vence en 2 h") no quede viejo con la pantalla abierta, sin leer el reloj
 * durante el render. Es una suscripción a un temporizador: se limpia al desmontar.
 */
export default function useAhora(intervaloMs = 60_000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(temporizador);
  }, [intervaloMs]);
  return ahora;
}
