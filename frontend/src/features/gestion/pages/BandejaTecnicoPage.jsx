import { useEffect, useRef, useState } from 'react';
import DataTable from '../../../components/ui/DataTable.jsx';
import PrioridadTag from '../../../components/ui/PrioridadTag.jsx';
import { interpretarError } from '../../../services/errores.js';
import { iniciarAtencion, resolver } from '../../../services/solicitudes.api.js';
import ModalResolucion from '../components/ModalResolucion.jsx';
import PestanasEstado from '../components/PestanasEstado.jsx';
import RegionAviso from '../components/RegionAviso.jsx';
import SlaIndicador from '../components/SlaIndicador.jsx';
import useAhora from '../hooks/useAhora.js';
import useAviso from '../hooks/useAviso.js';
import useBandeja from '../hooks/useBandeja.js';
import './BandejaTecnicoPage.css';

// El API ya limita la bandeja a las solicitudes asignadas al técnico (RN-16).
const PESTANAS = [
  {
    id: 'porIniciar',
    nombre: 'Por iniciar',
    estado: 'ASIGNADA',
    vacio: 'No tienes solicitudes por iniciar.',
  },
  {
    id: 'enCurso',
    nombre: 'En curso',
    estado: 'EN_ATENCION',
    vacio: 'No tienes solicitudes en curso.',
  },
];

/**
 * Bandeja del técnico (US-09 · UX W-07, móvil primero): "Por iniciar" y "En curso" como
 * tarjetas, con las acciones Iniciar atención y Resolver (`ModalResolucion`). Contenedor: llama al
 * API; tras cada acción refresca la lista y lo anuncia en una región `aria-live`.
 */
export default function BandejaTecnicoPage() {
  const [pestanaId, setPestanaId] = useState(PESTANAS[0].id);
  const [pagina, setPagina] = useState(0);
  const [iniciando, setIniciando] = useState(() => new Set());
  const [alerta, setAlerta] = useState('');
  const [resolviendo, setResolviendo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorResolucion, setErrorResolucion] = useState(null);
  const aviso = useAviso();
  // Ids con la petición en vuelo: una referencia, para ignorar un segundo clic antes del re-render.
  const enVuelo = useRef(new Set());
  const tituloRef = useRef(null);
  const pendienteFoco = useRef(false);

  const pestana = PESTANAS.find((p) => p.id === pestanaId);
  const bandeja = useBandeja({ estados: [pestana.estado], page: pagina });
  const ahora = useAhora();

  // Si la página actual quedó vacía (se inició su última fila), se retrocede a la anterior.
  if (!bandeja.isLoading && !bandeja.error && bandeja.data.length === 0 && pagina > 0) {
    setPagina(Math.min(pagina - 1, Math.max((bandeja.page?.totalPages ?? 1) - 1, 0)));
  }

  // Al terminar el refetch tras una acción, el foco pasa al título (la fila ya pudo desaparecer).
  useEffect(() => {
    if (!bandeja.isRefreshing && pendienteFoco.current) {
      pendienteFoco.current = false;
      tituloRef.current?.focus();
    }
  }, [bandeja.isRefreshing]);

  const cambiarPestana = (id) => {
    setPestanaId(id);
    setPagina(0);
    setAlerta('');
  };

  async function iniciar(solicitud) {
    if (enVuelo.current.has(solicitud.id)) return;
    enVuelo.current.add(solicitud.id);
    setIniciando(new Set(enVuelo.current));
    setAlerta('');
    aviso.limpiar();
    try {
      await iniciarAtencion(solicitud.id);
      aviso.anunciar(`${solicitud.codigo} está en atención. La encuentras en "En curso".`);
      pendienteFoco.current = true;
      bandeja.refetch();
    } catch (falla) {
      setAlerta(interpretarError(falla).general);
      // Un 409 significa que el estado real ya es otro: se refresca para mostrarlo.
      if (falla?.status === 409) bandeja.refetch();
    } finally {
      enVuelo.current.delete(solicitud.id);
      setIniciando(new Set(enVuelo.current));
    }
  }

  async function enviarResolucion(datos) {
    setEnviando(true);
    setErrorResolucion(null);
    aviso.limpiar();
    try {
      await resolver(resolviendo.id, datos);
      aviso.anunciar(`${resolviendo.codigo} marcada como resuelta.`);
      pendienteFoco.current = true;
      setResolviendo(null);
      bandeja.refetch();
    } catch (falla) {
      setErrorResolucion(falla);
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
  ];

  return (
    // AppShell no aporta `<main>`: cada página declara su landmark principal.
    <main className="bandeja-tecnico" aria-labelledby="bandeja-tecnico-titulo">
      <h1 id="bandeja-tecnico-titulo" ref={tituloRef} tabIndex={-1}>
        Mis asignadas
      </h1>
      <RegionAviso mensaje={aviso.mensaje} />
      {alerta && (
        <p role="alert" className="bandeja-tecnico__alerta">
          {alerta}
        </p>
      )}

      <PestanasEstado
        pestanas={PESTANAS}
        activa={pestanaId}
        onChange={cambiarPestana}
        etiqueta="Estado"
      >
        <DataTable
          caption="Solicitudes asignadas"
          columns={columnas}
          data={bandeja.data}
          isLoading={bandeja.isLoading}
          error={bandeja.error}
          onRetry={bandeja.refetch}
          emptyMessage={pestana.vacio}
          page={bandeja.page}
          onPageChange={setPagina}
          renderActions={(s) =>
            pestana.estado === 'ASIGNADA' ? (
              <button
                type="button"
                aria-label={`Iniciar atención ${s.codigo}`}
                disabled={iniciando.has(s.id)}
                onClick={() => iniciar(s)}
              >
                {iniciando.has(s.id) ? 'Iniciando…' : 'Iniciar atención'}
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Resolver ${s.codigo}`}
                onClick={() => {
                  aviso.limpiar();
                  setErrorResolucion(null);
                  setResolviendo(s);
                }}
              >
                Resolver
              </button>
            )
          }
        />
      </PestanasEstado>

      <ModalResolucion
        isOpen={resolviendo !== null}
        solicitud={resolviendo}
        onClose={() => setResolviendo(null)}
        onSubmit={enviarResolucion}
        isSubmitting={enviando}
        error={errorResolucion}
      />
    </main>
  );
}
