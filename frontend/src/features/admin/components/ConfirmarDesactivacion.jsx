import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import './adminUi.css';

export default function ConfirmarDesactivacion({
  isOpen,
  nombre,
  onConfirm,
  onCancel,
  isSaving = false,
  error = null,
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      titulo={`Desactivar ${nombre}`}
      descripcion={`${nombre} dejará de aparecer en los formularios. Los registros existentes no se modifican.`}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isSaving={isSaving}
      error={error}
      confirmLabel="Desactivar"
      savingLabel="Desactivando…"
    />
  );
}
