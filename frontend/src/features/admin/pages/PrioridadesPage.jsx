import { useState } from 'react';
import DataTable from '../../../components/ui/DataTable.jsx';
import ConfirmarDesactivacion from '../components/ConfirmarDesactivacion.jsx';
import PrioridadFormModal from '../components/PrioridadFormModal.jsx';
import useCrud from '../hooks/useCrud.js';
import '../components/adminUi.css';

const COLUMNAS = [
  { key: 'nivel', header: 'Nivel' },
  { key: 'ponderador', header: 'Urgencia' },
  { key: 'slaMaxHoras', header: 'SLA (horas)' },
  { key: 'activo', header: 'Estado', tipo: 'activo' },
];

/**
 * Administración de prioridades y su SLA (US-31, W-09). Contenedor: `useCrud` aporta el listado
 * y las mutaciones; la tabla y los modales son de presentación. Un cambio de SLA no es
 * retroactivo (CA-6): el modal de edición lo avisa. Sin búsqueda ni paginación: son pocas filas.
 */
export default function PrioridadesPage() {
  const crud = useCrud('/prioridades');
  const [dialogo, setDialogo] = useState(null); // { tipo: 'crear' | 'editar' | 'desactivar', fila? }
  const [aviso, setAviso] = useState('');
  const { general, campos } = crud.errorMutacion ?? { general: null, campos: {} };

  const abrir = (siguiente) => {
    crud.limpiarErrorMutacion();
    setAviso('');
    setDialogo(siguiente);
  };
  const cerrar = () => {
    crud.limpiarErrorMutacion();
    setDialogo(null);
  };

  async function ejecutar(mutacion, mensaje) {
    const { ok } = await mutacion();
    if (!ok) return;
    setDialogo(null);
    setAviso(mensaje);
  }

  const guardar = (datos) =>
    dialogo.tipo === 'crear'
      ? ejecutar(() => crud.crear(datos), `Prioridad «${datos.nivel}» creada.`)
      : ejecutar(
          () => crud.actualizar(dialogo.fila.id, datos),
          `Prioridad «${datos.nivel}» actualizada. El nuevo SLA aplica solo a solicitudes nuevas.`,
        );

  const reactivar = (fila) =>
    ejecutar(() => crud.reactivar(fila.id), `Prioridad «${fila.nivel}» reactivada.`);

  const formularioAbierto = dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar';

  return (
    <main className="admin-pagina">
      <div className="admin-pagina__cabecera">
        <h1>Administración de prioridades</h1>
        <button
          type="button"
          className="admin-boton admin-boton--primario"
          onClick={() => abrir({ tipo: 'crear' })}
        >
          Nueva prioridad
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
        caption="Prioridades"
        columns={COLUMNAS}
        data={crud.data}
        isLoading={crud.isLoading}
        error={crud.error}
        onRetry={crud.onRetry}
        includeInactive={crud.includeInactive}
        onIncludeInactiveChange={crud.onIncludeInactiveChange}
        emptyMessage="Aún no hay prioridades. Crea la primera."
        renderActions={(fila) =>
          fila.activo ? (
            <>
              <button
                type="button"
                className="admin-boton"
                aria-label={`Editar ${fila.nivel}`}
                onClick={() => abrir({ tipo: 'editar', fila })}
              >
                Editar
              </button>
              <button
                type="button"
                className="admin-boton"
                aria-label={`Desactivar ${fila.nivel}`}
                onClick={() => abrir({ tipo: 'desactivar', fila })}
              >
                Desactivar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-boton"
              aria-label={`Reactivar ${fila.nivel}`}
              onClick={() => reactivar(fila)}
            >
              Reactivar
            </button>
          )
        }
      />

      <PrioridadFormModal
        isOpen={formularioAbierto}
        prioridad={dialogo?.tipo === 'editar' ? dialogo.fila : null}
        onClose={cerrar}
        onSubmit={guardar}
        isSaving={crud.isSaving}
        errorGeneral={general}
        errorCampos={campos}
      />
      <ConfirmarDesactivacion
        isOpen={dialogo?.tipo === 'desactivar'}
        nombre={dialogo?.fila?.nivel ?? ''}
        onCancel={cerrar}
        onConfirm={() =>
          ejecutar(
            () => crud.desactivar(dialogo.fila.id),
            `Prioridad «${dialogo.fila.nivel}» desactivada.`,
          )
        }
        isSaving={crud.isSaving}
        error={general}
      />
    </main>
  );
}
