import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { interpretarError } from '../../../services/errores.js';
import './ModalAsignacion.css';

const MAX_NOTA = 255;
const CAMPOS = ['idPrioridad', 'idTecnico', 'nota'];

const clave = (texto) =>
  String(texto)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();

// `SolicitudDetalle` (api-rest §3.2) trae la prioridad como código ("ALTA"); el catálogo, `nombre`.
function idPrioridadActual(solicitud, prioridades) {
  const { prioridad } = solicitud;
  if (prioridad && typeof prioridad === 'object') return prioridad.id ?? null;
  if (!prioridad) return null;
  return prioridades.find((p) => clave(p.nombre) === clave(prioridad))?.id ?? null;
}

function etiquetaTecnico(tecnico, solicitud) {
  const base = `${tecnico.nombre} ${tecnico.apellido} · `;
  if (tecnico.activo === false) return { texto: `${base}inactivo`, disabled: true };
  const areaId = solicitud.area?.id;
  if (areaId != null && tecnico.idArea != null && tecnico.idArea !== areaId) {
    return { texto: `${base}otra área`, disabled: true };
  }
  const actual = solicitud.tecnico?.id === tecnico.id;
  return {
    texto: `${base}${tecnico.cargaActual} en curso${actual ? ' (actual)' : ''}`,
    disabled: actual,
  };
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
  const { solicitud, tecnicos, prioridades, tecnicoRef, onClose, onSubmit, isSubmitting, error } =
    props;
  const id = useId();
  const prioridadRef = useRef(null);
  const notaRef = useRef(null);
  const actual = idPrioridadActual(solicitud, prioridades);
  const [idTecnico, setIdTecnico] = useState('');
  const [idPrioridad, setIdPrioridad] = useState(actual == null ? '' : String(actual));
  const [nota, setNota] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);
  const { general, campos } = interpretarError(error, CAMPOS);

  // Con errores del servidor por campo, el foco va al primer campo inválido.
  useEffect(() => {
    const refs = { idPrioridad: prioridadRef, idTecnico: tecnicoRef, nota: notaRef };
    const primero = CAMPOS.find((campo) => interpretarError(error, CAMPOS).campos[campo]);
    if (primero) refs[primero].current?.focus();
  }, [error, tecnicoRef]);

  function enviar(evento) {
    evento.preventDefault();
    if (!idTecnico) {
      setErrorLocal('Selecciona un técnico para asignar.');
      tecnicoRef.current.focus();
      return;
    }
    const datos = { idTecnico: Number(idTecnico), nota: nota.trim() || undefined };
    // `asignar` no acepta prioridad: el contenedor debe llamar a `evaluar` antes si viene `idPrioridad`.
    if (idPrioridad && Number(idPrioridad) !== actual) datos.idPrioridad = Number(idPrioridad);
    onSubmit(datos);
  }

  return (
    <form className="modal-asignacion" onSubmit={enviar} noValidate>
      <p className="modal-asignacion__resumen">{solicitud.titulo}</p>

      {prioridades.length > 0 && (
        <Campo id={`${id}-prioridad`} etiqueta="Prioridad definitiva" error={campos.idPrioridad}>
          <select
            ref={prioridadRef}
            value={idPrioridad}
            onChange={(e) => setIdPrioridad(e.target.value)}
          >
            {actual == null && <option value="">Selecciona una prioridad</option>}
            {prioridades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo id={`${id}-tecnico`} etiqueta="Técnico" error={errorLocal ?? campos.idTecnico}>
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
            const { texto, disabled } = etiquetaTecnico(t, solicitud);
            return (
              <option key={t.id} value={t.id} disabled={disabled}>
                {texto}
              </option>
            );
          })}
        </select>
      </Campo>

      <Campo
        id={`${id}-nota`}
        etiqueta="Nota (opcional)"
        error={campos.nota}
        ayuda={`${nota.length} de ${MAX_NOTA} caracteres`}
      >
        <textarea
          ref={notaRef}
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

/**
 * Modal de asignación (US-08). Presentacional: no consulta la API; lo alimenta el contenedor
 * (BandejaSupervisorPage, #67).
 *
 * Props:
 * - isOpen, onClose: visibilidad y cierre (Esc y Cancelar; ambos se bloquean mientras `isSubmitting`).
 * - solicitud: `SolicitudDetalle` de api-rest §3.2. Se usan `codigo`, `titulo`, `area.id`,
 *   `tecnico` (reasignación: queda marcado "(actual)" y no elegible) y `prioridad` (código o
 *   `{id}`), que se cruza con `prioridades` por nombre. Si es null no se renderiza nada.
 * - tecnicos: `[{id, nombre, apellido, idArea, activo, cargaActual}]` (`GET /usuarios/tecnicos`).
 *   Los inactivos o de otra área se muestran deshabilitados y rotulados en texto.
 * - prioridades: `[{id, nombre}]` (`GET /prioridades`); sin lista no se muestra el selector.
 * - onSubmit({idTecnico, nota, idPrioridad?}): `idPrioridad` solo viene si difiere de la actual.
 *   `PUT …/asignar` NO acepta prioridad: si viene `idPrioridad`, el contenedor debe llamar antes a
 *   `PUT …/evaluar {idPrioridad}` y luego a `…/asignar {idTecnico, nota}`.
 * - isSubmitting: deshabilita el envío. error: error normalizado `{status, detail, errores,
 *   traceId, tipo?}` (ADR-012); los 400 por campo se asocian al campo y reciben el foco.
 */
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
  const tecnicoRef = useRef(null);
  if (!isOpen || !solicitud) return null;

  return (
    <Modal
      isOpen
      titulo={`Asignar ${solicitud.codigo}`}
      onClose={onClose}
      closeOnEsc={!isSubmitting}
      initialFocusRef={tecnicoRef}
    >
      <FormularioAsignacion
        {...{
          solicitud,
          tecnicos,
          prioridades,
          tecnicoRef,
          onClose,
          onSubmit,
          isSubmitting,
          error,
        }}
      />
    </Modal>
  );
}
