import { useRef } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import './adminUi.css';

// TODO(#146): reemplazar por `ConfirmDialog` cuando exista; este es un diálogo local con el
// mismo texto de UX §9 ("Confirmar desactivación") y `role="alertdialog"`.

/**
 * Confirmación de baja lógica (RN-14). El foco inicial va a "Cancelar" (la acción segura).
 * Props: `isOpen`, `nombre` (del registro), `onConfirm`, `onCancel`, `isSaving` (bloquea todo
 * mientras se envía) y `error` (texto del servidor, que se anuncia con `role="alert"`).
 */
export default function ConfirmarDesactivacion({
  isOpen,
  nombre,
  onConfirm,
  onCancel,
  isSaving = false,
  error = null,
}) {
  const cancelarRef = useRef(null);

  return (
    <Modal
      isOpen={isOpen}
      role="alertdialog"
      titulo={`Desactivar ${nombre}`}
      descripcion={`${nombre} dejará de aparecer en los formularios. Los registros existentes no se modifican.`}
      onClose={onCancel}
      closeOnEsc={!isSaving}
      initialFocusRef={cancelarRef}
    >
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <div className="admin-acciones">
        <button
          ref={cancelarRef}
          type="button"
          className="admin-boton"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="admin-boton admin-boton--peligro"
          onClick={onConfirm}
          disabled={isSaving}
        >
          {isSaving ? 'Desactivando…' : 'Desactivar'}
        </button>
      </div>
    </Modal>
  );
}
