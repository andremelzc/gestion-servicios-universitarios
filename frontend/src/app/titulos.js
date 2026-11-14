import { useEffect, useLayoutEffect } from 'react';

export const TITULO_SISTEMA = 'GISU · Gestión Integral de Servicios Universitarios';

// Título de cada pantalla (la pestaña del navegador y el historial lo muestran). Las rutas con
// parámetros (/solicitudes/:id) se resuelven por patrón; el detalle lo afina con el código.
const TITULOS = [
  [/^\/mis-solicitudes$/, 'Mis solicitudes'],
  [/^\/solicitudes\/nueva$/, 'Nueva solicitud'],
  [/^\/solicitudes\/confirmacion$/, 'Solicitud registrada'],
  [/^\/solicitudes\/[^/]+$/, 'Detalle de solicitud'],
  [/^\/bandeja$/, 'Bandeja'],
  [/^\/dashboard$/, 'Dashboard'],
  [/^\/admin\/usuarios$/, 'Usuarios'],
  [/^\/admin\/areas$/, 'Áreas'],
  [/^\/admin\/categorias$/, 'Categorías'],
  [/^\/admin\/prioridades$/, 'Prioridades'],
  [/^\/admin\/estados$/, 'Estados'],
  [/^\/perfil$/, 'Perfil'],
];

/** Título de una ruta, o `null` si no tiene uno propio. */
export function tituloDeRuta(pathname) {
  const ruta = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return TITULOS.find(([patron]) => patron.test(ruta))?.[1] ?? null;
}

const formatear = (titulo) => (titulo ? `${titulo} · GISU` : TITULO_SISTEMA);

/**
 * Título base de la ruta, que fija el shell. Usa `useLayoutEffect` a propósito: corre antes que los
 * efectos de las pantallas, de modo que una pantalla puede afinarlo con `useTituloPagina`.
 */
export function useTituloBase(titulo) {
  useLayoutEffect(() => {
    document.title = formatear(titulo);
  }, [titulo]);
}

/** Fija `document.title` como "Pantalla · GISU"; sin título vuelve al nombre completo del sistema. */
export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = formatear(titulo);
  }, [titulo]);
}
