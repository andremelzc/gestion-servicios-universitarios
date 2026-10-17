// Constraint Validation API + microcopy: setCustomValidity y mensajes enlazados a cada campo.
import { mostrarErrorCampo } from './ui.js';

export function validarCampo(campo, regla) {
  const mensaje = regla(campo.value);
  campo.setCustomValidity(mensaje ?? '');
  mostrarErrorCampo(campo, mensaje);
  return !mensaje;
}

// reglas: { idCampo: (valor) => mensaje | null }. Devuelve `validarTodo()`.
export function enlazarValidacion(formulario, reglas, { alCambiar } = {}) {
  for (const [id, regla] of Object.entries(reglas)) {
    const campo = formulario.elements[id];
    campo.addEventListener('blur', () => {
      campo.dataset.tocado = 'true';
      validarCampo(campo, regla);
    });
    campo.addEventListener('input', () => {
      if (campo.dataset.tocado) validarCampo(campo, regla);
      alCambiar?.(campo);
    });
    campo.addEventListener('change', () => {
      campo.dataset.tocado = 'true';
      validarCampo(campo, regla);
    });
  }
  return function validarTodo() {
    let primero = null;
    for (const [id, regla] of Object.entries(reglas)) {
      const campo = formulario.elements[id];
      campo.dataset.tocado = 'true';
      if (!validarCampo(campo, regla) && !primero) primero = campo;
    }
    primero?.focus();
    return !primero && formulario.checkValidity();
  };
}

// Aplica el mapa `errores` de un 400 RFC 7807 a los campos del formulario.
export function aplicarErroresServidor(formulario, errores) {
  let primero = null;
  for (const [id, mensaje] of Object.entries(errores)) {
    const campo = formulario.elements[id];
    if (!campo) continue;
    mostrarErrorCampo(campo, mensaje);
    primero ??= campo;
  }
  primero?.focus();
  return Boolean(primero);
}

export function enlazarMostrarPassword(boton, campo) {
  boton.addEventListener('click', () => {
    const visible = campo.type === 'password';
    campo.type = visible ? 'text' : 'password';
    boton.textContent = visible ? 'Ocultar' : 'Mostrar';
  });
}
