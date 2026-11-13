import { useEffect, useRef } from 'react';
import Modal from './Modal.jsx';
import './ConfirmDialog.css';

/** Confirmación reutilizable; inicia el foco en la acción segura. */
export default function ConfirmDialog({
  isOpen,
  titulo,
  descripcion,
  onConfirm,
  onCancel,
  isSaving = false,
  error,
  confirmLabel = 'Confirmar',
  savingLabel = 'Guardando…',
}) {
  const cancelarRef = useRef(null);
  const estadoRef = useRef(null);
  const estabaGuardando = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      estabaGuardando.current = false;
      return;
    }
    if (isSaving) estadoRef.current?.focus();
    else if (estabaGuardando.current) cancelarRef.current?.focus();
    estabaGuardando.current = isSaving;
  }, [isOpen, isSaving]);
  return (
    <Modal
      isOpen={isOpen}
      role="alertdialog"
      titulo={titulo}
      descripcion={descripcion}
      onClose={onCancel}
      closeOnEsc={!isSaving}
      initialFocusRef={cancelarRef}
    >
      {isSaving && (
        <p ref={estadoRef} role="status" tabIndex={-1}>
          {savingLabel}
        </p>
      )}
      {error && (
        <p role="alert" className="confirm-dialog__error">
          {error}
        </p>
      )}
      <div className="confirm-dialog__acciones">
        <button
          ref={cancelarRef}
          type="button"
          className="confirm-dialog__boton"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="confirm-dialog__boton confirm-dialog__boton--peligro"
          onClick={onConfirm}
          disabled={isSaving}
        >
          {isSaving ? savingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
