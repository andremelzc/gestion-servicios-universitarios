import { useEffect, useId, useState } from 'react';
import { apiClient } from '../../../services/apiClient.js';
import { contieneHtml } from '../../auth/schemas.js';

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
    try {
      await apiClient.post(ruta, {
        comentario: texto.trim(),
        privado: INTERNOS.includes(rol) && privado,
      });
      setTexto('');
      setPrivado(false);
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
    <section aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Comentarios</h2>
      {errorCarga && (
        <p role="alert">
          {errorCarga}{' '}
          <button type="button" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar carga
          </button>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {comentarios === null && !errorCarga && <p role="status">Cargando comentarios…</p>}
      {comentarios?.length === 0 && <p>No hay comentarios.</p>}
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
        <form onSubmit={enviar}>
          <label htmlFor={`${id}-comentario`}>Comentario</label>
          <textarea
            id={`${id}-comentario`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={500}
            required
          />
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
          <button type="submit" disabled={guardando || !texto.trim()}>
            {guardando ? 'Enviando…' : 'Enviar comentario'}
          </button>
        </form>
      )}
    </section>
  );
}
