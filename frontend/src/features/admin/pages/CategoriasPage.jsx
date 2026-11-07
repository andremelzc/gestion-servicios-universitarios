import DataTable from '../../../components/ui/DataTable.jsx';
import { useAreas } from '../../dashboard/hooks/useAreas.js';
import AccionesFila from '../components/AccionesFila.jsx';
import CategoriaFormModal from '../components/CategoriaFormModal.jsx';
import ConfirmarDesactivacion from '../components/ConfirmarDesactivacion.jsx';
import useAccionesCrud from '../hooks/useAccionesCrud.js';
import useCrud from '../hooks/useCrud.js';
import '../components/adminUi.css';

const COLUMNAS = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'area', header: 'Área' },
  { key: 'tiempoSlaHoras', header: 'SLA (horas)' },
  { key: 'activo', header: 'Estado', tipo: 'activo' },
];

/**
 * Administración de categorías (US-15, W-09). Contenedor: `useCrud` aporta el listado y las
 * mutaciones; la tabla y los modales son de presentación. La baja es lógica (RN-14): la categoría
 * deja de ofrecerse en el formulario de solicitud pero sigue en las solicitudes existentes.
 * Las áreas del selector salen de `GET /areas` (solo activas).
 */
export default function CategoriasPage() {
  const crud = useCrud('/categorias');
  const { areas, error: errorAreas } = useAreas(true);
  const { dialogo, aviso, general, campos, abrir, cerrar, ejecutar } = useAccionesCrud(crud);

  const guardar = (datos) =>
    dialogo.tipo === 'crear'
      ? ejecutar(() => crud.crear(datos), `Categoría «${datos.nombre}» creada.`)
      : ejecutar(
          () => crud.actualizar(dialogo.fila.id, datos),
          `Categoría «${datos.nombre}» actualizada.`,
        );

  const reactivar = (fila) =>
    ejecutar(() => crud.reactivar(fila.id), `Categoría «${fila.nombre}» reactivada.`);

  const formularioAbierto = dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar';

  return (
    <main className="admin-pagina">
      <div className="admin-pagina__cabecera">
        <h1>Administración de categorías</h1>
        <button
          type="button"
          className="admin-boton admin-boton--primario"
          onClick={() => abrir({ tipo: 'crear' })}
        >
          Nueva categoría
        </button>
      </div>

      <p role="status" className="admin-exito">
        {aviso}
      </p>
      {!dialogo && general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}

      <DataTable
        caption="Categorías"
        columns={COLUMNAS}
        data={crud.data}
        isLoading={crud.isLoading}
        error={crud.error}
        onRetry={crud.onRetry}
        includeInactive={crud.includeInactive}
        onIncludeInactiveChange={crud.onIncludeInactiveChange}
        emptyMessage="Aún no hay categorías. Crea la primera."
        renderActions={(fila) => (
          <AccionesFila
            activo={fila.activo}
            nombre={fila.nombre}
            isSaving={crud.isSaving}
            onEditar={() => abrir({ tipo: 'editar', fila })}
            onDesactivar={() => abrir({ tipo: 'desactivar', fila })}
            onReactivar={() => reactivar(fila)}
          />
        )}
      />

      <CategoriaFormModal
        isOpen={formularioAbierto}
        categoria={dialogo?.tipo === 'editar' ? dialogo.fila : null}
        areas={areas}
        errorAreas={errorAreas}
        onClose={cerrar}
        onSubmit={guardar}
        isSaving={crud.isSaving}
        errorGeneral={general}
        errorCampos={campos}
      />
      <ConfirmarDesactivacion
        isOpen={dialogo?.tipo === 'desactivar'}
        nombre={dialogo?.fila?.nombre ?? ''}
        onCancel={cerrar}
        onConfirm={() =>
          ejecutar(
            () => crud.desactivar(dialogo.fila.id),
            `Categoría «${dialogo.fila.nombre}» desactivada.`,
          )
        }
        isSaving={crud.isSaving}
        error={general}
      />
    </main>
  );
}
