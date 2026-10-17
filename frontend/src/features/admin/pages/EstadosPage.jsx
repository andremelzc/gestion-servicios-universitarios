import { useState } from 'react';
import DataTable from '../../../components/ui/DataTable.jsx';
import EstadoFormModal, { MuestraColor } from '../components/EstadoFormModal.jsx';
import useCrud from '../hooks/useCrud.js';
import '../components/adminUi.css';

const COLUMNAS = [
  { key: 'orden', header: 'Orden' },
  { key: 'nombreVisible', header: 'Nombre visible' },
  { key: 'codigo', header: 'Código' },
  {
    key: 'colorHex',
    header: 'Color',
    render: (fila) => (
      <span className="admin-muestra">
        <MuestraColor colorHex={fila.colorHex} />
        {fila.colorHex}
      </span>
    ),
  },
];

/**
 * Administración de la presentación de los estados (US-32, ADR-009, W-09): sin "Nuevo", sin baja
 * y sin filtro de inactivos, porque el conjunto de estados es fijo. Contenedor: `useCrud` aporta
 * el listado y `actualizar` (`PUT /estados/{codigo}`); el formulario vive en `EstadoFormModal`.
 */
export default function EstadosPage() {
  const crud = useCrud('/estados');
  const [estado, setEstado] = useState(null);
  const [aviso, setAviso] = useState('');
  const { general, campos } = crud.errorMutacion ?? { general: null, campos: {} };

  const abrir = (fila) => {
    crud.limpiarErrorMutacion();
    setAviso('');
    setEstado(fila);
  };
  const cerrar = () => {
    crud.limpiarErrorMutacion();
    setEstado(null);
  };

  async function guardar(datos) {
    const { ok } = await crud.actualizar(estado.codigo, datos);
    if (!ok) return;
    setEstado(null);
    setAviso(
      `Estado «${datos.nombreVisible}» actualizado. Se mostrará así en todas las pantallas.`,
    );
  }

  return (
    <main className="admin-pagina">
      <div className="admin-pagina__cabecera">
        <h1>Administración de estados</h1>
      </div>
      <p role="status" className="admin-exito">
        {aviso}
      </p>

      <DataTable
        caption="Estados"
        columns={COLUMNAS}
        rowKey="codigo"
        data={crud.data}
        isLoading={crud.isLoading}
        error={crud.error}
        onRetry={crud.onRetry}
        renderActions={(fila) => (
          <button
            type="button"
            className="admin-boton"
            aria-label={`Editar ${fila.codigo}`}
            onClick={() => abrir(fila)}
          >
            Editar
          </button>
        )}
      />

      <EstadoFormModal
        isOpen={estado !== null}
        estado={estado}
        onClose={cerrar}
        onSubmit={guardar}
        isSaving={crud.isSaving}
        errorGeneral={general}
        errorCampos={campos}
      />
    </main>
  );
}
