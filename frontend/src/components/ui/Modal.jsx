import { useEffect, useId, useRef } from 'react';
import './Modal.css';

const FOCUSABLES =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Modal mínimo y accesible (UX §2.4 y §8): atrapa el foco, `Esc` cierra y devuelve el foco al disparador.
export default function Modal({ isOpen, titulo, onClose, children }) {
  const tituloId = useId();
  const dialogoRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const disparador = document.activeElement;
    const dialogo = dialogoRef.current;
    // `matches` sobre todos los nodos conserva el orden del documento (querySelectorAll con grupos no).
    const enfocables = () =>
      [...dialogo.querySelectorAll('*')].filter((el) => el.matches(FOCUSABLES));
    (enfocables()[0] ?? dialogo).focus();

    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCloseRef.current();
        return;
      }
      if (evento.key !== 'Tab') return;

      const controles = enfocables();
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
      disparador?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal__fondo">
      <div
        ref={dialogoRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
      >
        <h2 id={tituloId} className="modal__titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
