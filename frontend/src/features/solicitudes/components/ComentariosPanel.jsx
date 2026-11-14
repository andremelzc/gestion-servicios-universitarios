import { useEffect, useId, useState } from 'react';
import { LineasCarga } from '../../../components/ui/Skeleton.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Card from '../../../components/ui/Card.jsx';
import { apiClient } from '../../../services/apiClient.js';
import { contieneHtml } from '../../auth/schemas.js';
import '../../admin/components/adminUi.css';
import './ComentariosPanel.css';

const INTERNOS = ['TECNICO', 'SUPERVISOR', 'ADMIN'];

function fechaComentario(valor) {
  if (!valor) return null;
  const zona = /(Z|[+-]\d{2}:?\d{2})$/.test(valor) ? valor : `${valor}Z`;
  const fecha = new Date(zona);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(fecha);
}

/** Comentarios visibles para el usuario; la API aplica permisos y estados finales. */
export default function ComentariosPanel({ solicitudId, rol, puedeComentar = true }) {
  const id = useId();
  const [comentarios, setComentarios] = useState(null);
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(false);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [intento, setIntento] = useState(0);
  const ruta = `/solicitudes/${encodeURIComponent(solicitudId)}/comentarios`;

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get(ruta, { signal: controller.signal }).then(
      (datos) => {
        if (!controller.signal.aborted) {
          setComentarios(Array.isArray(datos) ? datos : (datos?.content ?? []));
          setErrorCarga(null);
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setErrorCarga('No se pudieron cargar los comentarios.');
        }
      },
    );
    return () => controller.abort();
  }, [ruta, intento]);

  async function enviar(evento) {
    evento.preventDefault();
    if (!texto.trim() || guardando) return;
    if (contieneHtml(texto)) {
      setError('El comentario no debe contener etiquetas HTML.');
      return;
    }
    setGuardando(true);
    setError(null);
    setEnviado(false);
    try {
      await apiClient.post(ruta, {
        comentario: texto.trim(),
        privado: INTERNOS.includes(rol) && privado,
      });
      setTexto('');
      setPrivado(false);
      setEnviado(true);
      setIntento((valor) => valor + 1);
    } catch (fallo) {
      setError(
        fallo.status === 409
          ? 'No se puede comentar en una solicitud finalizada.'
          : fallo.detail || 'No se pudo guardar el comentario.',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card titulo="Comentarios" icono="message" tono="exito">
      {errorCarga && (
        <p role="alert">
          {errorCarga}{' '}
          <button type="button" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar carga
          </button>
        </p>
      )}
      {error && (
        <p role="alert" id={`${id}-error`} className="admin-error">
          {error}
        </p>
      )}
      {comentarios === null && !errorCarga && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Cargando comentarios…</span>
          <LineasCarga cantidad={2} />
        </div>
      )}
      {comentarios?.length === 0 && (
        <EmptyState compacto icono="message" titulo="No hay comentarios." />
      )}
      {comentarios?.length > 0 && (
        <ul>
          {comentarios.map((item) => {
            const fecha = fechaComentario(item.fechaComentario);
            return (
              <li key={item.id}>
                {item.usuario && <strong>{item.usuario}</strong>}
                {fecha && <p>{fecha}</p>}
                <p>{item.comentario}</p>
                {item.privado && <span>Privado</span>}
              </li>
            );
          })}
        </ul>
      )}
      {puedeComentar && (
        <form onSubmit={enviar} className="comentarios-form" noValidate>
          <div className="admin-campo">
            <label htmlFor={`${id}-comentario`}>Comentario</label>
            <textarea
              id={`${id}-comentario`}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setEnviado(false);
              }}
              maxLength={500}
              rows={4}
              aria-required="true"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? `${id}-error ${id}-contador` : `${id}-contador`}
            />
            <p id={`${id}-contador`} className="admin-ayuda">
              {texto.length} / 500
            </p>
          </div>
          {INTERNOS.includes(rol) && (
            <label>
              <input
                type="checkbox"
                checked={privado}
                onChange={(e) => setPrivado(e.target.checked)}
              />{' '}
              Privado para el equipo
            </label>
          )}
          <p role="status" className="admin-ayuda">
            {enviado ? 'Comentario enviado.' : ''}
          </p>
          <button
            type="submit"
            className="admin-boton admin-boton--primario"
            disabled={guardando || !texto.trim()}
          >
            {guardando ? 'Enviando…' : 'Enviar comentario'}
          </button>
        </form>
      )}
    </Card>
  );
}
