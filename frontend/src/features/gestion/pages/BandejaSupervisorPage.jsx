import { useEffect, useRef, useState } from 'react';
import DataTable from '../../../components/ui/DataTable.jsx';
import EstadoBadge from '../../../components/ui/EstadoBadge.jsx';
import PrioridadTag from '../../../components/ui/PrioridadTag.jsx';
import { asignar, evaluar } from '../../../services/solicitudes.api.js';
import ModalAsignacion from '../components/ModalAsignacion.jsx';
import PestanasEstado from '../components/PestanasEstado.jsx';
import RegionAviso from '../components/RegionAviso.jsx';
import SlaIndicador from '../components/SlaIndicador.jsx';
import useAhora from '../hooks/useAhora.js';
import useAviso from '../hooks/useAviso.js';
import useBandeja from '../hooks/useBandeja.js';
import useCatalogosBandeja from '../hooks/useCatalogosBandeja.js';
import './BandejaSupervisorPage.css';

const PESTANAS = [
  { id: 'porAsignar', nombre: 'Por asignar', estados: ['REGISTRADA', 'EN_EVALUACION'] },
  { id: 'enCurso', nombre: 'En curso', estados: ['ASIGNADA', 'EN_ATENCION'] },
  { id: 'resueltas', nombre: 'Resueltas', estados: ['RESUELTA'] },
  { id: 'todas', nombre: 'Todas', estados: [] },
];
const ESPERA_BUSQUEDA_MS = 300;
// Transiciones ASIGNAR (REGISTRADA, EN_EVALUACION) y REASIGNAR (ASIGNADA, EN_ATENCION) del backend.
const ESTADOS_ASIGNABLES = ['REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION'];
const ESTADOS_REASIGNABLES = ['ASIGNADA', 'EN_ATENCION'];
const FILTROS_INICIALES = {
  pestana: 'porAsignar',
  idPrioridad: '',
  idCategoria: '',
  idTecnico: '',
  q: '',
  vencidas: false,
  page: 0,
};

function Selector({ etiqueta, valor, onChange, opciones }) {
  if (opciones.length === 0) return null;
  return (
    <label className="data-table__campo">
      {etiqueta}
      <select
        className="data-table__control"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todas</option>
        {opciones.map(({ id, nombre }) => (
          <option key={id} value={id}>
            {nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Bandeja del supervisor (US-08 · UX W-06): pestañas por estado, filtros, búsqueda, paginación
 * y asignación con `ModalAsignacion`. Contenedor: consulta y escribe en el API; el dibujo es de
 * `DataTable` y del modal.
 *
 * La prioridad solo se puede cambiar en REGISTRADA: `PUT …/evaluar` solo admite esa transición
 * (Transicion.EVALUAR), así que en las demás filas el modal no ofrece el selector. `/evaluar` aún
 * no tiene endpoint en el backend (solo existe en MSW).
 */
export default function BandejaSupervisorPage() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [asignando, setAsignando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState(null);
  const aviso = useAviso();
  // Prioridad ya evaluada por solicitud: si `asignar` falla, el reintento no repite `evaluar`.
  const evaluadas = useRef(new Map());
  const tituloRef = useRef(null);
  const pendienteFoco = useRef(false);
  const catalogos = useCatalogosBandeja();

  const pestana = PESTANAS.find((p) => p.id === filtros.pestana);
  const { data, page, isLoading, isRefreshing, error, refetch } = useBandeja({
    ...filtros,
    estados: pestana.estados,
  });
  const ahora = useAhora();

  // Si la página actual quedó vacía (p. ej. se asignó su última fila), se retrocede a la anterior
  // en vez de mostrar "sin resultados" con solicitudes en las páginas previas.
  if (!isLoading && !error && data.length === 0 && filtros.page > 0) {
    setFiltros((f) => ({
      ...f,
      page: Math.min(f.page - 1, Math.max((page?.totalPages ?? 1) - 1, 0)),
    }));
  }

  // Tras una acción exitosa la fila suele desaparecer: al terminar el refetch el foco pasa al
  // título para no quedar en un botón que ya no existe.
  useEffect(() => {
    if (!isRefreshing && pendienteFoco.current) {
      pendienteFoco.current = false;
      tituloRef.current?.focus();
    }
  }, [isRefreshing]);

  // La búsqueda se aplica al dejar de escribir, para no consultar en cada tecla.
  useEffect(() => {
    const temporizador = setTimeout(
      () => setFiltros((f) => (f.q === busqueda ? f : { ...f, q: busqueda, page: 0 })),
      ESPERA_BUSQUEDA_MS,
    );
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  // Todo cambio de filtro vuelve a la primera página.
  const cambiar = (parcial) => setFiltros((f) => ({ ...f, ...parcial, page: 0 }));

  function cerrarAsignacion() {
    evaluadas.current.clear();
    setAsignando(null);
  }

  async function enviarAsignacion({ idPrioridad, ...datosAsignacion }) {
    const { id, codigo } = asignando;
    setEnviando(true);
    setErrorAsignacion(null);
    aviso.limpiar();
    try {
      if (idPrioridad && evaluadas.current.get(id) !== idPrioridad) {
        await evaluar(id, { idPrioridad });
        evaluadas.current.set(id, idPrioridad);
      }
      await asignar(id, datosAsignacion);
      const tecnico = catalogos.tecnicos.find((t) => t.id === datosAsignacion.idTecnico);
      const nombre = tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'el técnico elegido';
      aviso.anunciar(`${codigo} asignada a ${nombre}.`);
      pendienteFoco.current = true;
      cerrarAsignacion();
      refetch();
    } catch (falla) {
      setErrorAsignacion(falla);
      // `evaluar` ya cambió la solicitud (REGISTRADA → EN_EVALUACION): la lista debe reflejarlo.
      if (evaluadas.current.has(id)) refetch();
    } finally {
      setEnviando(false);
    }
  }

  const columnas = [
    { key: 'codigo', header: 'Código' },
    { key: 'titulo', header: 'Título' },
    {
      key: 'prioridadNivel',
      header: 'Prioridad',
      render: (s) => <PrioridadTag prioridad={s.prioridadNivel} mostrarPrefijo={false} />,
    },
    {
      key: 'estadoCodigo',
      header: 'Estado',
      render: (s) => (
        <EstadoBadge
          estado={s.estadoCodigo}
          nombre={s.estadoNombre}
          colorHex={s.estadoColorHex}
          mostrarPrefijo={false}
        />
      ),
    },
    {
      key: 'fechaLimiteSla',
      header: 'SLA',
      render: (s) => (
        <SlaIndicador
          fechaLimiteSla={s.fechaLimiteSla}
          vencida={s.vencida}
          estadoCodigo={s.estadoCodigo}
          ahora={ahora}
          mostrarPrefijo={false}
        />
      ),
    },
    {
      key: 'tecnicoNombreCompleto',
      header: 'Técnico',
      render: (s) => s.tecnicoNombreCompleto ?? '—',
    },
  ];

  const filtrosExtra = (
    <>
      <Selector
        etiqueta="Prioridad"
        valor={filtros.idPrioridad}
        onChange={(idPrioridad) => cambiar({ idPrioridad })}
        opciones={catalogos.prioridades}
      />
      <Selector
        etiqueta="Categoría"
        valor={filtros.idCategoria}
        onChange={(idCategoria) => cambiar({ idCategoria })}
        opciones={catalogos.categorias}
      />
      <Selector
        etiqueta="Técnico"
        valor={filtros.idTecnico}
        onChange={(idTecnico) => cambiar({ idTecnico })}
        opciones={catalogos.tecnicos.map((t) => ({
          id: t.id,
          nombre: `${t.nombre} ${t.apellido}`,
        }))}
      />
      <label className="data-table__campo data-table__campo--check">
        <input
          type="checkbox"
          checked={filtros.vencidas}
          onChange={(e) => cambiar({ vencidas: e.target.checked })}
        />
        Solo vencidas
      </label>
    </>
  );

  return (
    // AppShell no aporta `<main>`: cada página declara su landmark principal.
    <main className="bandeja-supervisor" aria-labelledby="bandeja-supervisor-titulo">
      <h1 id="bandeja-supervisor-titulo" ref={tituloRef} tabIndex={-1}>
        Bandeja de solicitudes
      </h1>
      <RegionAviso mensaje={aviso.mensaje} />

      <PestanasEstado
        pestanas={PESTANAS}
        activa={filtros.pestana}
        onChange={(id) => cambiar({ pestana: id })}
        etiqueta="Estado"
      >
        <DataTable
          caption="Solicitudes"
          columns={columnas}
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyMessage="No hay solicitudes en esta vista."
          search={busqueda}
          onSearchChange={setBusqueda}
          appliedSearch={filtros.q}
          filters={filtrosExtra}
          page={page}
          onPageChange={(n) => setFiltros((f) => ({ ...f, page: n }))}
          renderActions={(s) => {
            if (!ESTADOS_ASIGNABLES.includes(s.estadoCodigo)) return null;
            const verbo = ESTADOS_REASIGNABLES.includes(s.estadoCodigo) ? 'Reasignar' : 'Asignar';
            return (
              <button
                type="button"
                aria-label={`${verbo} ${s.codigo}`}
                onClick={() => {
                  aviso.limpiar();
                  setErrorAsignacion(null);
                  setAsignando({ ...s, prioridad: s.prioridadNivel });
                }}
              >
                {verbo}
              </button>
            );
          }}
        />
      </PestanasEstado>

      <ModalAsignacion
        isOpen={asignando !== null}
        solicitud={asignando}
        tecnicos={catalogos.tecnicos}
        prioridades={asignando?.estadoCodigo === 'REGISTRADA' ? catalogos.prioridades : []}
        onClose={cerrarAsignacion}
        onSubmit={enviarAsignacion}
        isSubmitting={enviando}
        error={errorAsignacion}
      />
    </main>
  );
}
