import './adminUi.css';

/**
 * Acciones de una fila de catálogo con baja lógica (RN-14): activa → Editar y Desactivar;
 * inactiva → Reactivar (deshabilitado mientras hay una mutación en curso). `nombre` sale en el
 * nombre accesible de cada botón para distinguir las filas ("Editar Mobiliario").
 */
export default function AccionesFila({
  activo,
  nombre,
  onEditar,
  onDesactivar,
  onReactivar,
  isSaving = false,
}) {
  if (!activo) {
    return (
      <button
        type="button"
        className="admin-boton"
        aria-label={`Reactivar ${nombre}`}
        disabled={isSaving}
        onClick={onReactivar}
      >
        Reactivar
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        className="admin-boton"
        aria-label={`Editar ${nombre}`}
        onClick={onEditar}
      >
        Editar
      </button>
      <button
        type="button"
        className="admin-boton"
        aria-label={`Desactivar ${nombre}`}
        onClick={onDesactivar}
      >
        Desactivar
      </button>
    </>
  );
}
