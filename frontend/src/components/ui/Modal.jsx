import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import Icon from './Icon.jsx';
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
 * - onClose: se invoca con Esc (si `closeOnEsc`) o con un clic en el fondo (si `closeOnOverlay`);
 *   cerrar de verdad es decisión del llamador.
 * - role: `dialog` (por defecto) o `alertdialog` para confirmaciones.
 * - descripcion: texto visible asociado con `aria-describedby`.
 * - closeOnEsc: `true` por defecto; con `false` Esc se ignora (p. ej. mientras se envía).
 * - closeOnOverlay: por defecto igual que `closeOnEsc` (así un modal que bloquea Esc mientras envía
 *   tampoco se cierra con el fondo). El clic debe empezar y terminar en el fondo: arrastrar una
 *   selección de texto hacia fuera del cuadro no lo cierra.
 * - initialFocusRef: ref del control con el foco inicial; si falta, el primer tabulable. Un hijo
 *   que ya tomó el foco al montarse lo conserva.
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
  closeOnOverlay = closeOnEsc,
  initialFocusRef,
  returnFocusRef,
}) {
  const id = useId();
  const dialogoRef = useRef(null);
  const opcionesRef = useRef({});
  const disparadorRef = useRef(null);
  const pulsoEnFondoRef = useRef(false);

  // Antes de cualquier efecto de los hijos (que pueden mover el foco): quién abrió el modal.
  useLayoutEffect(() => {
    if (isOpen) disparadorRef.current = document.activeElement;
  }, [isOpen]);

  useEffect(() => {
    opcionesRef.current = { onClose, closeOnEsc, initialFocusRef, returnFocusRef };
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const turno = {};
    const disparador = disparadorRef.current;
    const dialogo = dialogoRef.current;
    if (pila.length === 0) {
      overflowPrevio = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // AUD-20: el contenido de fondo deja de ser alcanzable por teclado y lectores de pantalla.
      document.getElementById('root')?.setAttribute('inert', '');
    }
    pila.push(turno);
    // Un hijo que ya tomó el foco al montarse (p. ej. el primer campo inválido) lo conserva.
    const activo = document.activeElement;
    if (activo === dialogo || !dialogo.contains(activo)) {
      (opcionesRef.current.initialFocusRef?.current ?? tabulables(dialogo)[0] ?? dialogo).focus();
    }

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
      if (pila.length === 0) {
        document.body.style.overflow = overflowPrevio;
        document.getElementById('root')?.removeAttribute('inert');
      }
      (opcionesRef.current.returnFocusRef?.current ?? destinoSeguro(disparador))?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal__fondo"
      onMouseDown={(evento) => {
        pulsoEnFondoRef.current = evento.target === evento.currentTarget;
      }}
      onClick={(evento) => {
        const enFondo = evento.target === evento.currentTarget && pulsoEnFondoRef.current;
        pulsoEnFondoRef.current = false;
        if (enFondo && closeOnOverlay) onClose();
      }}
    >
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
        <div className="modal__cuerpo">{children}</div>
        {/* Al final del DOM (se ve arriba a la derecha): el foco inicial sigue en el primer campo.
            Las confirmaciones (`alertdialog`) no lo llevan: obligan a elegir una opción. */}
        {role !== 'alertdialog' && (
          <button
            type="button"
            className="modal__cerrar"
            aria-label="Cerrar ventana"
            disabled={!closeOnEsc}
            onClick={onClose}
          >
            <Icon nombre="cerrar" tamano={20} />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
