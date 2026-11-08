import { useEffect, useId, useState } from 'react';
import { apiClient } from '../../../services/apiClient.js';
import { contieneHtml } from '../../auth/schemas.js';

const INTERNOS = ['TECNICO', 'SUPERVISOR', 'ADMIN'];

/** Comentarios visibles para el usuario; la API aplica permisos y estados finales. */
export default function ComentariosPanel({ solicitudId, rol, puedeComentar = true }) {
  const id = useId();
  const [comentarios, setComentarios] = useState(null);
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(false);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);
  const ruta = `/solicitudes/${encodeURIComponent(solicitudId)}/comentarios`;

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get(ruta, { signal: controller.signal }).then(
      (datos) => {
        if (!controller.signal.aborted) {
          setComentarios(Array.isArray(datos) ? datos : (datos?.content ?? []));
          setError(null);
          setErrorCarga(false);
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setError('No se pudieron cargar los comentarios.');
          setErrorCarga(true);
        }
      },
    );
    return () => controller.abort();
  }, [ruta, intento]);

  async function enviar(evento) {
    evento.preventDefault();
    if (!texto.trim() || guardando) return;
    setErrorCarga(false);
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
      {error && (
        <p role="alert">
          {error}{' '}
          {errorCarga && (
            <button type="button" onClick={() => setIntento((valor) => valor + 1)}>
              Reintentar carga
            </button>
          )}
        </p>
      )}
      {comentarios === null && !error && <p role="status">Cargando comentarios…</p>}
      {comentarios?.length === 0 && <p>No hay comentarios.</p>}
      {comentarios?.length > 0 && (
        <ul>
          {comentarios.map((item) => (
            <li key={item.id}>
              <p>{item.comentario}</p>
              {item.privado && <span>Privado</span>}
            </li>
          ))}
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
