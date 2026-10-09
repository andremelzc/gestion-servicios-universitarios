import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const CANDIDATOS =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [contenteditable]:not([contenteditable="false"]), [tabindex]';

// Pila de modales abiertos: solo el de arriba atiende Esc y Tab (modales anidados).
const pila = [];
let overflowPrevio = '';

function esTabulable(el) {
  const tabindex = el.getAttribute('tabindex');
  const indice = tabindex === null ? 0 : Number.parseInt(tabindex, 10);
  return (
    indice >= 0 &&
    !el.disabled &&
    !el.closest('[hidden]') &&
    el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== 'hidden'
  );
}

function tabulables(contenedor) {
  return [...contenedor.querySelectorAll(CANDIDATOS)].filter(esTabulable);
}

function destinoSeguro(disparador) {
  if (disparador && disparador !== document.body && document.contains(disparador))
    return disparador;
  const alternativa = document.querySelector('main, [role="main"]');
  if (alternativa && !alternativa.hasAttribute('tabindex'))
    alternativa.setAttribute('tabindex', '-1');
  return alternativa;
}

/**
 * Modal accesible mínimo (UX §2.4 y §8). Se dibuja en `document.body` con `createPortal`.
 * Atrapa el foco, bloquea el scroll del body y, al cerrar, devuelve el foco.
 *
 * Props:
 * - isOpen: si es false no renderiza nada.
 * - titulo: texto del título (`aria-labelledby`).
 * - onClose: se invoca con Esc (si `closeOnEsc`); cerrar de verdad es decisión del llamador.
 * - role: `dialog` (por defecto) o `alertdialog` para confirmaciones.
 * - descripcion: texto visible asociado con `aria-describedby`.
 * - closeOnEsc: `true` por defecto; con `false` Esc se ignora (p. ej. mientras se envía).
 * - initialFocusRef: ref del control con el foco inicial; si falta, el primer tabulable.
 * - returnFocusRef: ref del elemento que recibe el foco al cerrar; si falta se usa el disparador
 *   y, si ya no está en el DOM (o era `body`), el elemento `<main>`.
 * Con modales anidados solo el de arriba atiende Esc y el trap de Tab.
 */
export default function Modal({
  isOpen,
  titulo,
  onClose,
  children,
  role = 'dialog',
  descripcion,
  closeOnEsc = true,
  initialFocusRef,
  returnFocusRef,
}) {
  const id = useId();
  const dialogoRef = useRef(null);
  const opcionesRef = useRef({});

  useEffect(() => {
    opcionesRef.current = { onClose, closeOnEsc, initialFocusRef, returnFocusRef };
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const turno = {};
    const disparador = document.activeElement;
    const dialogo = dialogoRef.current;
    if (pila.length === 0) {
      overflowPrevio = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    pila.push(turno);
    (opcionesRef.current.initialFocusRef?.current ?? tabulables(dialogo)[0] ?? dialogo).focus();

    function alPulsarTecla(evento) {
      if (pila[pila.length - 1] !== turno) return;
      if (evento.key === 'Escape') {
        if (!opcionesRef.current.closeOnEsc) return;
        evento.preventDefault();
        opcionesRef.current.onClose();
        return;
      }
      if (evento.key !== 'Tab') return;

      const controles = tabulables(dialogo);
      if (controles.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = controles[0];
      const ultimo = controles[controles.length - 1];
      const activo = document.activeElement;
      if (!dialogo.contains(activo)) {
        evento.preventDefault();
        primero.focus();
      } else if (evento.shiftKey && activo === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      pila.splice(pila.indexOf(turno), 1);
      if (pila.length === 0) document.body.style.overflow = overflowPrevio;
      (opcionesRef.current.returnFocusRef?.current ?? destinoSeguro(disparador))?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal__fondo">
      <div
        ref={dialogoRef}
        className="modal"
        role={role}
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={descripcion ? `${id}-descripcion` : undefined}
        tabIndex={-1}
      >
        <h2 id={`${id}-titulo`} className="modal__titulo">
          {titulo}
        </h2>
        {descripcion && (
          <p id={`${id}-descripcion`} className="modal__descripcion">
            {descripcion}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
