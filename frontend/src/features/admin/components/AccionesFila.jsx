import './adminUi.css';

/**
 * Acciones de una fila de catálogo con baja lógica (RN-14): activa → Editar y Desactivar;
 * inactiva → Reactivar (con `aria-disabled` y sin acción mientras hay una mutación en curso: un
 * `disabled` real le quitaría el foco al teclado). `nombre` sale en el
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
        aria-disabled={isSaving ? 'true' : undefined}
        onClick={isSaving ? undefined : onReactivar}
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
