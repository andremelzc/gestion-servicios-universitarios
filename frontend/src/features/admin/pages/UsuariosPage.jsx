import { useMemo, useState } from 'react';
import DataTable from '../../../components/ui/DataTable.jsx';
import { useAreas } from '../../dashboard/hooks/useAreas.js';
import UsuarioFormModal from '../components/UsuarioFormModal.jsx';
import useCrud from '../hooks/useCrud.js';
import { ROLES, etiquetaRol } from '../roles.js';
import '../components/adminUi.css';

// `/admin/usuarios` filtra por `activo` (api-rest §3.6), no por `incluirInactivos`. Como la API no
// fija su valor por defecto, sin la casilla se pide `activo=true` y con ella se omite.
const paramInactivos = (incluir) => (incluir ? {} : { activo: true });

// Constante de módulo: referencia estable para el efecto de foco del formulario.
const SIN_ERROR = { general: null, campos: {} };

/**
 * Administración de usuarios (US-17, US-34, W-09). Contenedor: `useCrud` aporta el listado
 * paginado, la búsqueda y las mutaciones; la tabla es de presentación. Los filtros de rol y área
 * son estado local de la página y viajan como parámetros de la consulta (`rol`, `idArea`); no se
 * reflejan en la URL del navegador.
 */
export default function UsuariosPage() {
  const [rol, setRol] = useState('');
  const [idArea, setIdArea] = useState('');
  const crud = useCrud('/admin/usuarios', { paramInactivos, filtros: { rol, idArea } });
  const { areas } = useAreas(true);
  const [dialogo, setDialogo] = useState(null); // { tipo: 'crear' | 'editar', fila? }
  const [aviso, setAviso] = useState('');
  const { general, campos } = crud.errorMutacion ?? SIN_ERROR;

  const abrir = (siguiente) => {
    crud.limpiarErrorMutacion();
    setAviso('');
    setDialogo(siguiente);
  };
  const cerrar = () => {
    crud.limpiarErrorMutacion();
    setDialogo(null);
  };

  async function guardar(datos) {
    const creando = dialogo.tipo === 'crear';
    const { ok } = await (creando ? crud.crear(datos) : crud.actualizar(dialogo.fila.id, datos));
    if (!ok) return;
    const nombre = `${datos.nombre} ${datos.apellido}`;
    setDialogo(null);
    setAviso(`Usuario «${nombre}» ${creando ? 'creado' : 'actualizado'}.`);
  }

  const nombreArea = useMemo(() => new Map(areas.map((a) => [a.id, a.nombre])), [areas]);

  const columnas = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (u) => `${u.nombre} ${u.apellido}`,
    },
    { key: 'correo', header: 'Correo' },
    { key: 'rol', header: 'Rol', render: (u) => etiquetaRol(u.rol) },
    {
      key: 'idArea',
      header: 'Área',
      render: (u) => (u.idArea == null ? '—' : (nombreArea.get(u.idArea) ?? `Área ${u.idArea}`)),
    },
    { key: 'activo', header: 'Estado', tipo: 'activo' },
  ];

  const filtros = (
    <>
      <label className="data-table__campo">
        Rol
        <select
          className="data-table__control"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="">Todos</option>
          {ROLES.map((r) => (
            <option key={r.codigo} value={r.codigo}>
              {r.etiqueta}
            </option>
          ))}
        </select>
      </label>
      {areas.length > 0 && (
        <label className="data-table__campo">
          Área
          <select
            className="data-table__control"
            value={idArea}
            onChange={(e) => setIdArea(e.target.value)}
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );

  return (
    <main className="admin-pagina">
      <div className="admin-pagina__cabecera">
        <h1>Administración de usuarios</h1>
        <button
          type="button"
          className="admin-boton admin-boton--primario"
          onClick={() => abrir({ tipo: 'crear' })}
        >
          Nuevo usuario
        </button>
      </div>

      <p role="status" className="admin-exito">
        {aviso}
      </p>

      <DataTable
        caption="Usuarios"
        columns={columnas}
        data={crud.data}
        isLoading={crud.isLoading}
        error={crud.error}
        onRetry={crud.onRetry}
        search={crud.search}
        onSearchChange={crud.onSearchChange}
        appliedSearch={crud.appliedSearch}
        includeInactive={crud.includeInactive}
        onIncludeInactiveChange={crud.onIncludeInactiveChange}
        page={crud.page}
        onPageChange={crud.onPageChange}
        etiquetasActivo={{ activo: 'Activo', inactivo: 'Inactivo' }}
        filters={filtros}
        emptyMessage="No hay usuarios que coincidan con los filtros."
        renderActions={(fila) => (
          <button
            type="button"
            className="admin-boton"
            aria-label={`Editar ${fila.nombre} ${fila.apellido}`}
            onClick={() => abrir({ tipo: 'editar', fila })}
          >
            Editar
          </button>
        )}
      />

      <UsuarioFormModal
        isOpen={dialogo !== null}
        usuario={dialogo?.tipo === 'editar' ? dialogo.fila : null}
        areas={areas}
        onClose={cerrar}
        onSubmit={guardar}
        isSaving={crud.isSaving}
        errorGeneral={general}
        errorCampos={campos}
      />
    </main>
  );
}
