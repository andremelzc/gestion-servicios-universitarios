import Button from '../../../components/ui/Button.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Toast from '../../../components/ui/Toast.jsx';
import DataTable from '../../../components/ui/DataTable.jsx';
import AccionesFila from '../components/AccionesFila.jsx';
import AreaFormModal from '../components/AreaFormModal.jsx';
import ConfirmarDesactivacion from '../components/ConfirmarDesactivacion.jsx';
import useAccionesCrud from '../hooks/useAccionesCrud.js';
import useCrud from '../hooks/useCrud.js';
import '../components/adminUi.css';

// Un 409 al crear o editar es por nombre repetido (unicidad).
const CONFLICTO_NOMBRE = { campoUnico: 'nombre' };

const COLUMNAS = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'correoContacto', header: 'Correo de contacto' },
  { key: 'activo', header: 'Estado', tipo: 'activo' },
];

/**
 * Administración de áreas (US-16, US-33, W-09). Contenedor: `useCrud` aporta el listado y las
 * mutaciones; la tabla y los modales son de presentación. La baja es lógica (RN-14); un área con
 * usuarios activos no se desactiva (409), y el aviso del servidor se muestra en la confirmación.
 */
export default function AreasPage() {
  const crud = useCrud('/areas');
  const { dialogo, aviso, general, campos, abrir, cerrar, ejecutar } = useAccionesCrud(crud);

  const guardar = (datos) =>
    dialogo.tipo === 'crear'
      ? ejecutar(() => crud.crear(datos), `Área «${datos.nombre}» creada.`, CONFLICTO_NOMBRE)
      : ejecutar(
          () => crud.actualizar(dialogo.fila.id, datos),
          `Área «${datos.nombre}» actualizada.`,
          CONFLICTO_NOMBRE,
        );

  const reactivar = (fila) =>
    ejecutar(() => crud.reactivar(fila.id), `Área «${fila.nombre}» reactivada.`);

  const formularioAbierto = dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar';

  return (
    <main className="admin-pagina">
      <PageHeader
        titulo="Administración de áreas"
        descripcion="Gestiona las áreas que atienden las solicitudes."
        icono="building"
        acciones={
          <Button icono="plus" onClick={() => abrir({ tipo: 'crear' })}>
            Nueva área
          </Button>
        }
      />

      <Toast mensaje={aviso} />
      {!dialogo && general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}

      <DataTable
        caption="Áreas"
        columns={COLUMNAS}
        data={crud.data}
        isLoading={crud.isLoading}
        error={crud.error}
        onRetry={crud.onRetry}
        includeInactive={crud.includeInactive}
        onIncludeInactiveChange={crud.onIncludeInactiveChange}
        emptyMessage="Aún no hay áreas. Crea la primera."
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

      <AreaFormModal
        isOpen={formularioAbierto}
        area={dialogo?.tipo === 'editar' ? dialogo.fila : null}
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
            `Área «${dialogo.fila.nombre}» desactivada.`,
          )
        }
        isSaving={crud.isSaving}
        error={general}
      />
    </main>
  );
}
