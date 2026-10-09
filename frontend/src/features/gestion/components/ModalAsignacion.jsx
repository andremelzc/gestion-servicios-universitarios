import { cloneElement, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { interpretarError } from '../utils/mensajesError.js';
import './ModalAsignacion.css';

const MAX_NOTA = 255;

function disponibilidad(tecnico, solicitud) {
  if (tecnico.activo === false) return 'inactivo';
  if (solicitud.idArea != null && tecnico.idArea != null && tecnico.idArea !== solicitud.idArea) {
    return 'otra área';
  }
  return null;
}

// Etiqueta, control y mensajes asociados (`aria-invalid`, `aria-describedby`) para un solo control.
function Campo({ id, etiqueta, error, ayuda, children }) {
  const descritoPor = [error && `${id}-error`, ayuda && `${id}-ayuda`].filter(Boolean).join(' ');
  return (
    <div className="modal-asignacion__campo">
      <label htmlFor={id}>{etiqueta}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': descritoPor || undefined,
      })}
      {ayuda && (
        <span id={`${id}-ayuda`} className="modal-asignacion__contador">
          {ayuda}
        </span>
      )}
      {error && (
        <p id={`${id}-error`} className="modal-asignacion__error">
          {error}
        </p>
      )}
    </div>
  );
}

function FormularioAsignacion(props) {
  const { solicitud, tecnicos, prioridades, onClose, onSubmit, isSubmitting, error } = props;
  const id = useId();
  const tecnicoRef = useRef(null);
  const [idTecnico, setIdTecnico] = useState('');
  const [idPrioridad, setIdPrioridad] = useState(
    String(solicitud.idPrioridad ?? prioridades[0]?.id ?? ''),
  );
  const [nota, setNota] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);
  const { general, campos } = interpretarError(error);

  const errorTecnico = errorLocal ?? campos.idTecnico;

  function enviar(evento) {
    evento.preventDefault();
    if (!idTecnico) {
      setErrorLocal('Selecciona un técnico para asignar.');
      tecnicoRef.current.focus();
      return;
    }
    onSubmit({
      idTecnico: Number(idTecnico),
      idPrioridad: prioridades.length > 0 && idPrioridad ? Number(idPrioridad) : undefined,
      nota: nota.trim() || undefined,
    });
  }

  return (
    <form className="modal-asignacion" onSubmit={enviar} noValidate>
      <p className="modal-asignacion__resumen">{solicitud.titulo}</p>

      {prioridades.length > 0 && (
        <Campo id={`${id}-prioridad`} etiqueta="Prioridad definitiva" error={campos.idPrioridad}>
          <select value={idPrioridad} onChange={(e) => setIdPrioridad(e.target.value)}>
            {prioridades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo id={`${id}-tecnico`} etiqueta="Técnico" error={errorTecnico}>
        <select
          ref={tecnicoRef}
          value={idTecnico}
          onChange={(e) => {
            setIdTecnico(e.target.value);
            setErrorLocal(null);
          }}
        >
          <option value="">Selecciona un técnico</option>
          {tecnicos.map((t) => {
            const motivo = disponibilidad(t, solicitud);
            return (
              <option key={t.id} value={t.id} disabled={motivo !== null}>
                {`${t.nombre} ${t.apellido} · ${motivo ?? `${t.cargaActual} en curso`}`}
              </option>
            );
          })}
        </select>
      </Campo>

      <Campo
        id={`${id}-nota`}
        etiqueta="Nota (opcional)"
        error={campos.nota}
        ayuda={`${nota.length}/${MAX_NOTA}`}
      >
        <textarea
          rows={3}
          maxLength={MAX_NOTA}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </Campo>

      {general && (
        <p role="alert" className="modal-asignacion__alerta">
          {general}
        </p>
      )}

      <div className="modal-asignacion__acciones">
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className="modal-asignacion__primario" disabled={isSubmitting}>
          {isSubmitting ? 'Asignando…' : 'Asignar'}
        </button>
      </div>
    </form>
  );
}

// Presentacional: no consulta la API. El contenedor (BandejaSupervisorPage) provee los datos y el envío.
export default function ModalAsignacion({
  isOpen,
  solicitud,
  tecnicos,
  prioridades = [],
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}) {
  return (
    <Modal
      isOpen={isOpen}
      titulo={`Asignar ${solicitud.codigo}`}
      onClose={isSubmitting ? () => {} : onClose}
    >
      <FormularioAsignacion
        {...{ solicitud, tecnicos, prioridades, onClose, onSubmit, isSubmitting, error }}
      />
    </Modal>
  );
}
