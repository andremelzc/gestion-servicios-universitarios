import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EstadoBadge from '../../../components/ui/EstadoBadge.jsx';
import PrioridadTag from '../../../components/ui/PrioridadTag.jsx';
import { etiquetaEstado } from '../../../components/ui/catalogos.js';
import { apiClient } from '../../../services/apiClient.js';
import { interpretarError } from '../../../services/errores.js';
import { cerrar } from '../../../services/solicitudes.api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import SlaIndicador from '../../gestion/components/SlaIndicador.jsx';
import useAhora from '../../gestion/hooks/useAhora.js';
import { PaginaCargando } from '../../../components/ui/Skeleton.jsx';
import { useTituloPagina } from '../../../app/titulos.js';
import Button from '../../../components/ui/Button.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Card from '../../../components/ui/Card.jsx';
import { IconoFicha } from '../../../components/ui/Icon.jsx';
import AccionesSolicitud from '../../gestion/components/AccionesSolicitud.jsx';
import '../../admin/components/adminUi.css';
import ComentariosPanel from '../components/ComentariosPanel.jsx';
import './DetalleSolicitudPage.css';

function fecha(valor) {
  if (!valor) return 'Sin fecha';
  const zona = /(Z|[+-]\d{2}:?\d{2})$/.test(valor) ? valor : `${valor}Z`;
  const instante = new Date(zona);
  return Number.isNaN(instante.getTime())
    ? valor
    : new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Lima',
      }).format(instante);
}

export function Timeline({ historial }) {
  if (!historial.length)
    return <EmptyState compacto icono="clock" titulo="Esta solicitud aún no tiene movimientos." />;
  return (
    <ol className="detalle-solicitud__timeline">
      {historial.map((evento, indice) => (
        <li key={`${evento.fecha}-${indice}`}>
          <strong>{etiquetaEstado(evento.estadoNuevo)}</strong>
          <p>
            <time>{fecha(evento.fecha)}</time> · {evento.usuario || 'Sistema'}
          </p>
          {evento.nota && <p>{evento.nota}</p>}
        </li>
      ))}
    </ol>
  );
}

export default function DetalleSolicitudPage() {
  const { id } = useParams();
  return <DetalleSolicitud key={id} id={id} />;
}

function DetalleSolicitud({ id }) {
  const { usuario } = useAuth();
  const ahora = useAhora();
  const [datos, setDatos] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState(null);
  const [descargando, setDescargando] = useState(null);
  const [intento, setIntento] = useState(0);
  const [cerrando, setCerrando] = useState(false);
  useTituloPagina(datos?.codigo ?? 'Detalle de solicitud');
  const [errorCierre, setErrorCierre] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiClient.get(`/solicitudes/${encodeURIComponent(id)}`, { signal: controller.signal }),
      apiClient.get(`/solicitudes/${encodeURIComponent(id)}/historial`, {
        signal: controller.signal,
      }),
    ])
      .then(([solicitud, movimientos]) => {
        if (!controller.signal.aborted) {
          setDatos(solicitud);
          setHistorial(movimientos);
          setCargando(false);
        }
      })
      .catch((fallo) => {
        if (!controller.signal.aborted) {
          setError(interpretarError(fallo).general || 'No se pudo cargar la solicitud.');
          setCargando(false);
        }
      });
    return () => controller.abort();
  }, [id, intento]);

  const descargar = useCallback(
    async (evidencia) => {
      setErrorDescarga(null);
      setDescargando(evidencia.id);
      try {
        const blob = await apiClient.get(
          `/solicitudes/${encodeURIComponent(id)}/evidencias/${encodeURIComponent(evidencia.id)}`,
          { responseType: 'blob' },
        );
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = evidencia.nombre;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (fallo) {
        setErrorDescarga(interpretarError(fallo).general || 'No se pudo descargar la evidencia.');
      } finally {
        setDescargando(null);
      }
    },
    [id],
  );

  const cerrarSolicitud = useCallback(async () => {
    setErrorCierre(null);
    setCerrando(true);
    try {
      await cerrar(id);
      setIntento((n) => n + 1);
    } catch (fallo) {
      setErrorCierre(interpretarError(fallo).general || 'No se pudo cerrar la solicitud.');
    } finally {
      setCerrando(false);
    }
  }, [id]);

  if (cargando) return <PaginaCargando texto="Cargando solicitud…" tipo="detalle" />;
  if (error)
    return (
      <main className="detalle-solicitud">
        <p role="alert" className="aviso-error">
          {error}
        </p>
        <div className="detalle-solicitud__error-acciones">
          <button
            type="button"
            className="admin-boton"
            onClick={() => {
              setCargando(true);
              setError(null);
              setIntento((n) => n + 1);
            }}
          >
            Reintentar
          </button>
          <Link className="admin-boton" to="/">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  const esEstudiante = usuario?.rol === 'ESTUDIANTE';
  const nombreCompleto = (persona) =>
    [persona?.nombre, persona?.apellido].filter(Boolean).join(' ');

  return (
    <main className="detalle-solicitud">
      <Button
        como={Link}
        variante="enlace"
        icono="arrowLeft"
        className="detalle-solicitud__volver"
        to={esEstudiante ? '/mis-solicitudes' : '/bandeja'}
      >
        {esEstudiante ? 'Volver a mis solicitudes' : 'Volver a la bandeja'}
      </Button>
      <h1>
        {datos.codigo} · {datos.titulo}
      </h1>
      <div className="detalle-solicitud__etiquetas">
        <EstadoBadge
          estado={datos.estadoCodigo ?? datos.estado?.codigo}
          nombre={datos.estadoNombre ?? datos.estado?.nombreVisible}
          colorHex={datos.estadoColorHex ?? datos.estado?.colorHex}
        />
        <PrioridadTag prioridad={datos.prioridadNivel ?? datos.prioridad} />
        <SlaIndicador
          fechaLimiteSla={datos.fechaLimiteSla}
          vencida={datos.vencida}
          estadoCodigo={datos.estadoCodigo ?? datos.estado?.codigo}
          ahora={ahora}
        />
      </div>
      <div className="detalle-solicitud__layout">
        <div className="detalle-solicitud__principal">
          <Card titulo="Detalle" icono="clipboard">
            <dl className="detalle-solicitud__datos">
              <div>
                <dt>Descripción</dt>
                <dd>{datos.descripcion}</dd>
              </div>
              <div>
                <dt>Categoría</dt>
                <dd>{datos.categoriaNombre || datos.categoria?.nombre || 'Sin categoría'}</dd>
              </div>
              <div>
                <dt>Área</dt>
                <dd>{datos.areaNombre || datos.area?.nombre || 'Sin área'}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>
                  {datos.ubicacionCampus} · {datos.ubicacionAmbiente}
                </dd>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>
                  {datos.solicitanteNombreCompleto ||
                    nombreCompleto(datos.solicitante) ||
                    'Sin dato'}
                </dd>
              </div>
              <div>
                <dt>Técnico</dt>
                <dd>
                  {datos.tecnicoNombreCompleto || nombreCompleto(datos.tecnico) || 'Sin asignar'}
                </dd>
              </div>
              <div>
                <dt>Registrada</dt>
                <dd>{fecha(datos.fechaRegistro)}</dd>
              </div>
              {datos.informeResolucion && (
                <div>
                  <dt>Informe de resolución</dt>
                  <dd>{datos.informeResolucion}</dd>
                </div>
              )}
            </dl>
            {errorCierre && <p role="alert">{errorCierre}</p>}
            <AccionesSolicitud
              acciones={datos.accionesPermitidas?.filter((a) => a === 'CERRAR')}
              accionEnCurso={cerrando ? 'CERRAR' : null}
              onAccion={cerrarSolicitud}
            />
          </Card>
          <ComentariosPanel
            solicitudId={id}
            rol={usuario?.rol}
            puedeComentar={datos.accionesPermitidas?.includes('COMENTAR') ?? false}
          />
        </div>
        <aside className="detalle-solicitud__lateral">
          <Card titulo="Evidencias" icono="paperclip" tono="violeta">
            {errorDescarga && <p role="alert">{errorDescarga}</p>}
            {datos.evidencias?.length ? (
              <ul>
                {datos.evidencias.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-busy={descargando === item.id ? 'true' : undefined}
                      disabled={descargando !== null}
                      onClick={() => descargar(item)}
                    >
                      {descargando === item.id ? `Descargando ${item.nombre}…` : item.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compacto icono="paperclip" titulo="Sin evidencias." />
            )}
          </Card>
          <details className="detalle-solicitud__historial detalle-solicitud__seccion" open>
            <summary>
              <h2>
                <IconoFicha nombre="clock" tono="neutro" />
                Historial
              </h2>
            </summary>
            <Timeline historial={historial} />
          </details>
        </aside>
      </div>
    </main>
  );
}
