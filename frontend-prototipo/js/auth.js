// Sesión del navegador: envuelve el almacenamiento real (puede estar bloqueado).
import { crearSesion } from './lib/session.js';

function almacen() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export const sesion = crearSesion(almacen());
